/**
 * Rows of a table: where they are stored (Excel connector, or the browser in demo mode)
 * and the React hook used by the pages.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  asList,
  callConnector,
  DATA_MODE,
  EXCEL_SOURCE,
  SHAREPOINT_SOURCE,
} from "@/lib/power-apps";
import type { Row, TableDef } from "@/tables/schema";
import { fromExcel, toExcel } from "@/tables/schema";
import { ensureExcelTable, excelTarget } from "./excel";
import { folderTarget, resolveLink } from "./sharepoint";

/** Where rows live: the Excel connector, or the browser (demo mode). */
export interface RowsProvider {
  list(table: TableDef): Promise<Row[]>;
  insert(table: TableDef, row: Omit<Row, "id">): Promise<Row>;
  update(table: TableDef, row: Partial<Row> & { id: string }): Promise<void>;
  remove(table: TableDef, id: string): Promise<void>;
  /** Stores an image and returns the value saved in the cell (its url). */
  uploadImage(table: TableDef, file: File): Promise<string>;
}

/** File → base64 (without the "data:…;base64," prefix). */
const toBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const newId = () => crypto.randomUUID().slice(0, 8);
const fileName = (file: File) =>
  `${Date.now()}-${file.name.replace(/[^\w.-]+/g, "_")}`;

/* ------------------------------------------------------------------ */
/* Excel Online (Business) + SharePoint connectors                     */
/* ------------------------------------------------------------------ */

/** Connector location of the table: workbook ids resolved from its link, then table created / completed if needed. */
async function excel(table: TableDef) {
  const location = await excelTarget(table);
  await ensureExcelTable(table, location);
  return { ...location, table: table.excel.table };
}

const connectorProvider: RowsProvider = {
  async list(table) {
    const data = await callConnector<unknown>(EXCEL_SOURCE!, "GetItems", {
      ...(await excel(table)),
      $top: 5000,
    });
    return asList<Record<string, unknown>>(data)
      .map((record) => fromExcel(table, record))
      .filter((row) => row.id);
  },
  async insert(table, values) {
    const row = { ...values, id: newId() } as Row;
    await callConnector(EXCEL_SOURCE!, "AddRowV2", {
      ...(await excel(table)),
      item: toExcel(table, row),
      dateTimeFormat: "ISO 8601",
    });
    return row;
  },
  async update(table, row) {
    const { id, ...item } = toExcel(table, row);
    await callConnector(EXCEL_SOURCE!, "PatchItem", {
      ...(await excel(table)),
      idColumn: "id",
      id,
      item,
      dateTimeFormat: "ISO 8601",
    });
  },
  async remove(table, id) {
    await callConnector(EXCEL_SOURCE!, "DeleteItem", {
      ...(await excel(table)),
      idColumn: "id",
      id,
    });
  },
  async uploadImage(table, file) {
    if (!table.images)
      throw new Error("No image folder configured for this table");
    const folder = await resolveLink(table.images.url);
    const name = fileName(file);
    await callConnector(SHAREPOINT_SOURCE!, "CreateFile", {
      ...folderTarget(folder),
      name,
      // Binary connector bodies must be base64: the SDK decodes them back to raw bytes.
      body: await toBase64(file),
    });
    return `${folder.webUrl.replace(/\/$/, "")}/${encodeURIComponent(name)}`;
  },
};

/* ------------------------------------------------------------------ */
/* Demo: rows kept in localStorage, seeded with the table's sample     */
/* ------------------------------------------------------------------ */

const demoKey = (table: TableDef) => `hub:demo:${table.name}`;
const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

function readDemo(table: TableDef): Row[] {
  try {
    const saved = localStorage.getItem(demoKey(table));
    if (saved) return JSON.parse(saved);
  } catch {
    /* corrupted or blocked storage: start over from the sample */
  }
  return (table.sample ?? []).map(
    (row, i) => ({ ...row, id: `demo-${i + 1}` }) as Row,
  );
}
const writeDemo = (table: TableDef, rows: Row[]) =>
  localStorage.setItem(demoKey(table), JSON.stringify(rows));

const demoProvider: RowsProvider = {
  async list(table) {
    await delay(350);
    return readDemo(table);
  },
  async insert(table, values) {
    await delay();
    const row = { ...values, id: newId() } as Row;
    writeDemo(table, [...readDemo(table), row]);
    return row;
  },
  async update(table, patch) {
    await delay();
    writeDemo(
      table,
      readDemo(table).map((row) =>
        row.id === patch.id ? ({ ...row, ...patch } as Row) : row,
      ),
    );
  },
  async remove(table, id) {
    await delay();
    writeDemo(
      table,
      readDemo(table).filter((row) => row.id !== id),
    );
  },
  async uploadImage(_table, file) {
    // Data URL so the image survives a reload (fine for a demo, not for real files).
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  },
};

export const provider: RowsProvider =
  DATA_MODE === "connector" ? connectorProvider : demoProvider;

/** Resets the demo rows of a table to its sample. */
export const resetDemo = (table: TableDef) =>
  localStorage.removeItem(demoKey(table));

/* ------------------------------------------------------------------ */
/* React hook                                                          */
/* ------------------------------------------------------------------ */

const REFRESH = 60_000;

type Action =
  | { type: "insert"; row: Omit<Row, "id"> }
  | { type: "update"; row: Partial<Row> & { id: string } }
  | { type: "delete"; id: string };

/** Rows of a table (refreshed every minute, so edits made in Excel show up) + mutations. */
export function useRows(table: TableDef) {
  const client = useQueryClient();
  const key = ["rows", table.name];
  const query = useQuery({
    queryKey: key,
    queryFn: () => provider.list(table),
    refetchInterval: REFRESH,
    staleTime: 10_000,
  });

  const mutation = useMutation({
    mutationFn: async (action: Action) => {
      if (action.type === "insert") return provider.insert(table, action.row);
      if (action.type === "update") await provider.update(table, action.row);
      else await provider.remove(table, action.id);
      return null;
    },
    // Show the change right away; the full re-read happens in the background.
    onSuccess: (created, action) =>
      client.setQueryData<Row[]>(key, (rows = []) =>
        created
          ? [...rows, created]
          : action.type === "update"
            ? rows.map((r) =>
                r.id === action.row.id ? ({ ...r, ...action.row } as Row) : r,
              )
            : rows.filter((r) => r.id !== (action as { id: string }).id),
      ),
    onSettled: () => void client.invalidateQueries({ queryKey: key }),
  });

  return {
    rows: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refresh: () => query.refetch(),
    saving: mutation.isPending,
    insert: async (row: Omit<Row, "id">) =>
      (await mutation.mutateAsync({ type: "insert", row }))!,
    update: async (row: Partial<Row> & { id: string }) =>
      void (await mutation.mutateAsync({ type: "update", row })),
    remove: async (id: string) =>
      void (await mutation.mutateAsync({ type: "delete", id })),
    uploadImage: (file: File) => provider.uploadImage(table, file),
  };
}

import { toast } from "sonner";
import { asList, callConnector, EXCEL_SOURCE } from "@/lib/power-apps";
import type { TableDef } from "@/tables/schema";
import { type ExcelTarget, excelSource, resolveLink } from "./sharepoint";

const call = <T>(operation: string, parameters: Record<string, unknown>) =>
  callConnector<T>(EXCEL_SOURCE!, operation, parameters);

/** source / drive / file of the workbook, inferred from its link (explicit values win). */
export async function excelTarget(table: TableDef): Promise<ExcelTarget> {
  const { url, source, drive, file } = table.excel;
  if (drive && file) return { source: source ?? "me", drive, file };
  const item = await resolveLink(url);
  if (item.isFolder)
    throw new Error(
      `The link of "${table.label}" points to a folder, not to an Excel file`,
    );
  return {
    source: source ?? (await excelSource(item.siteUrl)),
    drive: item.driveId,
    file: item.itemId,
  };
}

/** Columns the Excel table must have: the `id` key, then the declared fields. */
const headersOf = (table: TableDef) => [
  "id",
  ...table.columns.map((f) => f.name),
];

/** Keys of a row returned by the connector that are not columns. */
const isColumn = (key: string) =>
  !key.startsWith("@") && key !== "ItemInternalId";

/** 1 → A, 27 → AA */
const columnLetter = (n: number): string =>
  n <= 0
    ? ""
    : columnLetter(Math.floor((n - 1) / 26)) +
      String.fromCharCode(65 + ((n - 1) % 26));

/** Worksheet names: max 31 chars, none of : \ / ? * [ ] */
const sheetName = (name: string) =>
  name.replace(/[:\\/?*[\]]/g, " ").slice(0, 31);

const ready = new Map<string, Promise<void>>();

/**
 * Makes sure the Excel table exists with every declared column (once per session and table):
 * - missing table   → worksheet + table created with all the columns
 * - missing columns → appended to the right (existing columns are never removed or moved)
 */
export function ensureExcelTable(table: TableDef, at: ExcelTarget) {
  const key = `${at.source}|${at.drive}|${at.file}|${table.excel.table}`;
  if (!ready.has(key))
    ready.set(
      key,
      setup(table, at).catch((error: unknown) => {
        ready.delete(key); // retry on the next call
        throw error;
      }),
    );
  return ready.get(key)!;
}

async function setup(table: TableDef, at: ExcelTarget) {
  const name = table.excel.table;
  const headers = headersOf(table);

  const tables = asList<{ name?: string }>(await call("GetTables", at));
  if (!tables.some((t) => t.name?.toLowerCase() === name.toLowerCase())) {
    const sheet = sheetName(name);
    // The worksheet may already exist (table deleted by hand): ignore that error.
    await call("CreateWorksheet", { ...at, body: { name: sheet } }).catch(
      () => undefined,
    );
    await call("CreateTable", {
      ...at,
      table: {
        TableName: name,
        Range: `'${sheet}'!A1:${columnLetter(headers.length)}1`,
        ColumnsNames: headers.join(";"),
      },
    });
    toast.success(`Excel table "${name}" created`, {
      description: `${headers.length} columns`,
    });
    return;
  }

  const existing = await readColumns(table, at);
  const missing = headers.filter(
    (h) => !existing.some((c) => c.toLowerCase() === h.toLowerCase()),
  );
  for (const column of missing) await addColumn(table, at, column);
  if (missing.length)
    toast.success(`Columns added to "${name}"`, {
      description: missing.join(", "),
    });
}

/** Header names of an existing table, read from its first row. */
async function readColumns(
  table: TableDef,
  at: ExcelTarget,
): Promise<string[]> {
  const where = { ...at, table: table.excel.table };
  const read = async () =>
    asList<Record<string, unknown>>(
      await call("GetItems", { ...where, $top: 1 }),
    )[0];
  const first = await read();
  if (first) return Object.keys(first).filter(isColumn);

  // Empty table: add a blank probe row to see its columns, then remove it.
  await call("AddRowV2", { ...where, item: {} });
  const probe = (await read()) ?? {};
  const columns = Object.keys(probe).filter(isColumn);
  if (!columns.includes("id")) await addColumn(table, at, "id"); // also gives the probe row a key
  const keyed = columns.includes("id") ? probe : ((await read()) ?? {});
  if (keyed.id)
    await call("DeleteItem", {
      ...where,
      idColumn: "id",
      id: String(keyed.id),
    });
  return [...columns, "id"];
}

/** Appends a column to the right of the table. `id` is filled with a unique key for existing rows. */
const addColumn = (table: TableDef, at: ExcelTarget, column: string) =>
  call("CreateIdColumn", {
    ...at,
    table: table.excel.table,
    idColumn: column,
    populateColumn: column === "id",
  });

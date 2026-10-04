import type { Row, TableDef } from "@/tables/schema";
import { useLocalState } from "./use-local-state";

export type Sort = { column: string; direction: "asc" | "desc" } | null;

/** What a user chose to see on a table, remembered in this browser. */
export type TableView = {
  search: string;
  /** Selected option values per option field (any selected value matches). */
  options: Record<string, string[]>;
  /** Show only rows where these boolean fields are true. */
  flags: string[];
  sort: Sort;
  /** Visible columns; null = table default. */
  columns: string[] | null;
};

const emptyView: TableView = {
  search: "",
  options: {},
  flags: [],
  sort: null,
  columns: null,
};

export function useTableView(table: TableDef) {
  const { filters } = table;
  const initial: TableView = {
    ...emptyView,
    search: filters?.search ?? "",
    options: Object.fromEntries(
      Object.entries(filters?.options ?? {}).map(([k, v]) => [k, [...v]]),
    ),
    flags: [...(filters?.flags ?? [])],
    sort: table.sort ?? null,
  };
  const [view, setView] = useLocalState<TableView>(
    `hub:view:${table.name}`,
    initial,
  );
  const merged = { ...initial, ...view };
  return {
    view: merged,
    change: (patch: Partial<TableView>) =>
      setView((v) => ({ ...emptyView, ...v, ...patch })),
    clearFilters: () =>
      setView((v) => ({
        ...emptyView,
        ...v,
        search: "",
        options: {},
        flags: [],
      })),
    hasFilters:
      !!merged.search ||
      merged.flags.length > 0 ||
      Object.values(merged.options).some((s) => s.length),
  };
}

export const defaultColumns = (table: TableDef) => [
  ...(table.defaultColumns ??
    table.columns
      .filter((f) => f.name !== "name")
      .slice(0, 4)
      .map((f) => f.name)),
];

export const visibleFields = (table: TableDef, view: TableView) => {
  const names = view.columns ?? defaultColumns(table);
  return table.columns.filter((field) => names.includes(field.name));
};

const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});
const text = (value: unknown) =>
  [value]
    .flat()
    .filter((v) => v !== null && v !== undefined)
    .join(", ");

export function applyView(rows: Row[], view: TableView) {
  const search = view.search.trim().toLowerCase();
  const filtered = rows.filter(
    (row) =>
      Object.entries(view.options).every(
        ([column, selected]) =>
          !selected.length ||
          [row[column]].flat().some((v) => selected.includes(String(v))),
      ) &&
      view.flags.every((flag) => row[flag] === true) &&
      (!search ||
        Object.values(row).some((value) =>
          text(value).toLowerCase().includes(search),
        )),
  );
  const { sort } = view;
  if (!sort) return filtered;
  const factor = sort.direction === "asc" ? 1 : -1;
  return filtered.sort((a, b) => {
    const [x, y] = [a[sort.column], b[sort.column]];
    const [emptyX, emptyY] = [text(x) === "", text(y) === ""];
    if (emptyX || emptyY) return Number(emptyX) - Number(emptyY); // empty values last
    if (typeof x === "number" && typeof y === "number") return (x - y) * factor;
    return collator.compare(text(x), text(y)) * factor;
  });
}

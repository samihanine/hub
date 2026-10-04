import type { LucideIcon } from "lucide-react";

export const OPTION_COLORS = [
  "gray",
  "red",
  "orange",
  "yellow",
  "lime",
  "green",
  "teal",
  "cyan",
  "blue",
  "indigo",
  "violet",
  "pink",
] as const;
export type OptionColor = (typeof OPTION_COLORS)[number];
export type Option = { value: string; label?: string; color?: OptionColor };

export type FieldType =
  | "string"
  | "text"
  | "number"
  | "boolean"
  | "option"
  | "date"
  | "url"
  | "image";

export type Field = {
  /** Column name in the Excel table (header). */
  name: string;
  label?: string;
  description?: string;
  type: FieldType;
  /** For "option" fields. */
  options?: readonly Option[];
  required?: boolean;
  /** Several values, stored "a; b; c" in Excel. */
  multiple?: boolean;
};

/**
 * Excel table: the workbook link + the name of the table inside it.
 * Any OneDrive / SharePoint link works (sharing link, "Doc.aspx?sourcedoc=" link, direct path):
 * the drive and file ids are resolved at runtime. The table and its columns are created if missing.
 */
export type ExcelLocation = {
  url: string;
  table: string;
  /** Optional overrides, normally inferred from `url`. */
  source?: string;
  drive?: string;
  file?: string;
};

/** OneDrive / SharePoint folder (any link to it) where images uploaded from the form are stored. */
export type ImageFolder = { url: string };

export type TableDef = {
  /** Used in the url: /tables?name=<name> */
  name: string;
  label: string;
  description?: string;
  icon?: LucideIcon;
  excel: ExcelLocation;
  images?: ImageFolder;
  /** Emails allowed to use role=write ("*" = everyone). Empty = nobody. */
  writers?: readonly string[];
  columns: readonly Field[];
  /** Fields shown under each row of the list (the user can change them). Default: the first 4 after `name`. */
  defaultColumns?: readonly string[];
  /** KPI cards: number of rows per value of an option field (all its options unless `values` is set). */
  kpi?: { field: string; values?: readonly string[] };
  /**
   * Filters applied on first visit (the user can change or clear them; their choice is then remembered).
   * `options`: selected values per option field, `flags`: boolean fields that must be true.
   */
  filters?: {
    search?: string;
    options?: Record<string, readonly string[]>;
    flags?: readonly string[];
  };
  /** Default order of the rows. */
  sort?: { column: string; direction: "asc" | "desc" };
  /** Rows used in demo mode (no Excel connection yet). */
  sample?: readonly Omit<Row, "id">[];
};

export type Value = string | number | boolean | string[] | null;
export type Row = { id: string; [field: string]: Value };

/** Identity helper giving autocompletion when declaring a table. */
export const defineTable = <T extends TableDef>(table: T) => table;

export const fieldLabel = (field: Field) =>
  field.label ?? field.name.replace(/_/g, " ");
export const findOption = (field: Field, value: string): Option =>
  field.options?.find((o) => o.value === value) ?? { value };

export const canWrite = (table: TableDef, email: string | undefined) => {
  const writers = (table.writers ?? []).map((w) => w.toLowerCase());
  return (
    writers.includes("*") || (!!email && writers.includes(email.toLowerCase()))
  );
};

/** Returns an error message, or null when the row is valid. */
export function validate(table: TableDef, row: Partial<Row>) {
  for (const field of table.columns) {
    const value = row[field.name];
    const empty =
      value === null ||
      value === undefined ||
      value === "" ||
      (Array.isArray(value) && !value.length);
    if (field.required && empty) return `"${fieldLabel(field)}" is required`;
    if (!empty && field.type === "number" && Number.isNaN(Number(value)))
      return `"${fieldLabel(field)}" must be a number`;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Excel <-> Row                                                       */
/* ------------------------------------------------------------------ */

const SEPARATOR = /\s*;\s*/;

/** Excel cells come back as strings: parse them following the field type. */
export function fromExcel(
  table: TableDef,
  record: Record<string, unknown>,
): Row {
  const row: Row = { id: String(record.id ?? "") };
  for (const field of table.columns) {
    const raw = record[field.name];
    const text = raw === null || raw === undefined ? "" : String(raw).trim();
    if (field.multiple)
      row[field.name] = text ? text.split(SEPARATOR).filter(Boolean) : [];
    else if (!text) row[field.name] = null;
    else if (field.type === "number")
      row[field.name] = Number(text.replace(",", "."));
    else if (field.type === "boolean")
      row[field.name] = ["true", "vrai", "1", "yes", "oui"].includes(
        text.toLowerCase(),
      );
    else if (field.type === "date") row[field.name] = excelDate(text);
    else row[field.name] = text;
  }
  return row;
}

export function toExcel(table: TableDef, row: Partial<Row>) {
  const record: Record<string, string> = {};
  if (row.id !== undefined) record.id = row.id;
  for (const field of table.columns) {
    if (!(field.name in row)) continue;
    const value = row[field.name];
    record[field.name] =
      value === null || value === undefined
        ? ""
        : Array.isArray(value)
          ? value.join("; ")
          : typeof value === "boolean"
            ? value
              ? "TRUE"
              : "FALSE"
            : String(value);
  }
  return record;
}

/** Excel serial dates ("45123") or ISO strings → "yyyy-mm-dd". */
function excelDate(text: string) {
  if (/^\d+(\.\d+)?$/.test(text)) {
    const date = new Date(Date.UTC(1899, 11, 30) + Number(text) * 86_400_000);
    return date.toISOString().slice(0, 10);
  }
  return text.slice(0, 10);
}

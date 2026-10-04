import type { Field, Row, Value } from "@/tables/schema";
import { fieldLabel, findOption } from "@/tables/schema";

/* ---------------------------- Reading a CSV ---------------------------- */

export type Csv = { headers: string[]; rows: string[][] };

/**
 * Parses a CSV text: delimiter guessed from the first line ("," ";" or tab), quoted fields
 * ("a, b", "say ""hi""", line breaks inside quotes), blank lines skipped.
 */
export function parseCsv(text: string): Csv {
  const source = text.replace(/^\uFEFF/, "");
  const firstLine = source.split(/\r?\n/, 1)[0] ?? "";
  const delimiter = [";", "\t", ","].reduce((best, d) =>
    firstLine.split(d).length > firstLine.split(best).length ? d : best,
  );

  const records: string[][] = [];
  let record: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (quoted) {
      if (c === '"' && source[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"' && cell === "") quoted = true;
    else if (c === delimiter) {
      record.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && source[i + 1] === "\n") i++;
      record.push(cell);
      records.push(record);
      record = [];
      cell = "";
    } else cell += c;
  }
  if (cell !== "" || record.length) {
    record.push(cell);
    records.push(record);
  }
  const filled = records.filter((r) => r.some((v) => v.trim() !== ""));
  const [headers = [], ...rows] = filled;
  return { headers: headers.map((h) => h.trim()), rows };
}

const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

/** Best CSV header for a table column (same name or label, ignoring case / accents / spaces). */
export function guessHeader(field: Field, headers: string[]) {
  const keys = [field.name, fieldLabel(field)].map(normalize);
  return headers.find((h) => keys.includes(normalize(h)));
}

/** CSV text → the value of a field (number, yes/no, option value or label, multiple values…). */
export function toValue(field: Field, raw: string): Value {
  const text = raw.trim();
  if (field.type === "boolean")
    return ["1", "true", "yes", "y", "oui", "x", "vrai"].includes(
      text.toLowerCase(),
    );
  if (!text) return field.multiple ? [] : null;
  const one = (v: string): string => {
    if (field.type !== "option") return v;
    const match = (field.options ?? []).find(
      (o) =>
        normalize(o.value) === normalize(v) ||
        normalize(o.label ?? "") === normalize(v),
    );
    return match?.value ?? v;
  };
  if (field.multiple)
    return text
      .split(/\s*[;|]\s*/)
      .filter(Boolean)
      .map(one);
  if (field.type === "number") {
    const n = Number(text.replace(/\s/g, "").replace(",", "."));
    return Number.isNaN(n) ? null : n;
  }
  if (field.type === "date") {
    // dd/mm/yyyy → yyyy-mm-dd; anything else is kept as given
    const m = text.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
    return m
      ? `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`
      : text;
  }
  return one(text);
}

/* ---------------------------- Copying rows ---------------------------- */

/** Readable text of a value (option labels, yes / no, lists joined by ";"). */
export function displayValue(field: Field, value: Value | undefined): string {
  if (value === null || value === undefined) return "";
  if (field.type === "boolean") return value === true ? "Yes" : "No";
  const list = [value].flat().map(String);
  return list
    .map((v) =>
      field.type === "option" ? (findOption(field, v).label ?? v) : v,
    )
    .join("; ");
}

/** Rows as tab-separated text with a header line (pastes as a table in Excel / Sheets). */
export function rowsToTsv(fields: readonly Field[], rows: Row[]) {
  const clean = (s: string) => s.replace(/[\t\r\n]+/g, " ");
  return [
    fields.map((f) => clean(fieldLabel(f))).join("\t"),
    ...rows.map((row) =>
      fields.map((f) => clean(displayValue(f, row[f.name]))).join("\t"),
    ),
  ].join("\n");
}

/** Clipboard write, with a fallback for frames where the Clipboard API is not allowed. */
export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.style.cssText = "position:fixed;opacity:0";
    document.body.append(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    if (!ok) throw new Error("The clipboard is not available here");
  }
}

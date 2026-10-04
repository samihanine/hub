import { FileUpIcon, Loader2Icon } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { type Csv, guessHeader, parseCsv, toValue } from "@/lib/csv";
import { cn } from "@/lib/utils";
import type { Row, TableDef, Value } from "@/tables/schema";
import { fieldLabel, validate } from "@/tables/schema";

const NONE = "__none__";

/**
 * Import drawer (write mode): pick a CSV, match its columns to the table's columns (guessed from
 * the names), then its rows are added at the end of the table.
 */
export function CsvImport({
  table,
  open,
  onOpenChange,
  onInsert,
}: {
  table: TableDef;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (row: Omit<Row, "id">) => Promise<Row>;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<{ name: string; csv: Csv } | null>(null);
  /** Table column → index of its CSV column (as a string), or NONE. */
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [over, setOver] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);

  const load = async (picked?: File) => {
    if (!picked) return;
    const csv = parseCsv(await picked.text());
    if (!csv.headers.length || !csv.rows.length)
      return void toast.error("This CSV has no rows");
    setFile({ name: picked.name, csv });
    setMapping(
      Object.fromEntries(
        table.columns.map((f) => {
          const header = guessHeader(f, csv.headers);
          return [f.name, header ? String(csv.headers.indexOf(header)) : NONE];
        }),
      ),
    );
  };

  // CSV rows → table rows, with the rows that would be refused (required field missing…).
  const prepared = useMemo(() => {
    if (!file) return { rows: [], invalid: 0 };
    const index = (name: string) =>
      mapping[name] && mapping[name] !== NONE ? Number(mapping[name]) : -1;
    const rows: Omit<Row, "id">[] = [];
    let invalid = 0;
    for (const record of file.csv.rows) {
      const row: Record<string, Value> = {};
      for (const field of table.columns) {
        const i = index(field.name);
        if (i >= 0) row[field.name] = toValue(field, record[i] ?? "");
      }
      if (validate(table, row)) invalid++;
      else rows.push(row);
    }
    return { rows, invalid };
  }, [file, mapping, table]);

  const mapped = Object.values(mapping).filter((h) => h !== NONE).length;

  const reset = () => {
    setFile(null);
    setMapping({});
    setProgress(null);
  };

  const run = async () => {
    setProgress(0);
    let done = 0;
    try {
      for (const row of prepared.rows) {
        await onInsert(row);
        setProgress(++done);
      }
      toast.success(`${done} row${done === 1 ? "" : "s"} imported`, {
        description: prepared.invalid
          ? `${prepared.invalid} skipped (required field missing or invalid)`
          : undefined,
      });
      reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(`Import stopped after ${done} rows`, {
        description: error instanceof Error ? error.message : String(error),
      });
      setProgress(null);
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (progress !== null) return; // not while importing
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle className="font-normal font-title text-lg">
            Import a CSV
          </SheetTitle>
          <SheetDescription>
            Its rows are added at the end of “{table.label}”.
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
          <button
            type="button"
            onClick={() => input.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(true);
            }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setOver(false);
              void load(e.dataTransfer.files[0]);
            }}
            className={cn(
              "flex w-full flex-col items-center justify-center gap-1.5 border border-dashed px-4 text-muted-foreground text-sm transition-colors",
              file ? "h-16" : "h-32",
              over
                ? "border-gold bg-background text-foreground"
                : "hover:border-gold hover:text-foreground",
            )}
          >
            <FileUpIcon className="size-5 text-gold" strokeWidth={1.25} />
            {file ? (
              <span className="truncate">
                {file.name} · {file.csv.rows.length} rows — choose another file
              </span>
            ) : (
              "Drop a CSV or click to choose it"
            )}
          </button>
          <input
            ref={input}
            type="file"
            accept=".csv,text/csv,text/plain"
            hidden
            onChange={(e) => {
              void load(e.target.files?.[0]);
              e.target.value = "";
            }}
          />

          {file && (
            <section>
              <h3 className="mb-2 text-[10px] text-muted-foreground uppercase tracking-[0.22em]">
                Columns ({mapped} / {table.columns.length} matched)
              </h3>
              <div className="divide-y border">
                {table.columns.map((field) => (
                  <div
                    key={field.name}
                    className="flex items-center gap-3 px-3 py-2"
                  >
                    <span className="min-w-0 flex-1 truncate text-[13px] capitalize">
                      {fieldLabel(field)}
                      {field.required && <span className="text-gold"> *</span>}
                    </span>
                    <Select
                      value={mapping[field.name] ?? NONE}
                      onValueChange={(header) =>
                        setMapping((m) => ({ ...m, [field.name]: header }))
                      }
                    >
                      <SelectTrigger size="sm" className="w-44 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem
                          value={NONE}
                          className="text-muted-foreground"
                        >
                          — Not imported
                        </SelectItem>
                        {file.csv.headers.map((header, i) => (
                          <SelectItem key={i} value={String(i)}>
                            {header || `Column ${i + 1}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <SheetFooter className="border-t">
          {file && (
            <p className="text-muted-foreground text-xs">
              {prepared.rows.length} row{prepared.rows.length === 1 ? "" : "s"}{" "}
              ready
              {prepared.invalid > 0 &&
                ` · ${prepared.invalid} will be skipped (required field missing)`}
            </p>
          )}
          <Button
            disabled={!file || !prepared.rows.length || progress !== null}
            onClick={() => void run()}
            className="text-[10px] uppercase tracking-[0.22em]"
          >
            {progress !== null ? (
              <>
                <Loader2Icon className="animate-spin" /> {progress} /{" "}
                {prepared.rows.length}
              </>
            ) : (
              `Import ${prepared.rows.length || ""} rows`
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

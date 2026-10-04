import { CheckIcon, Loader2Icon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { DATA_MODE } from "@/lib/power-apps";
import { cn } from "@/lib/utils";
import type { Field, Row, TableDef, Value } from "@/tables/schema";
import { fieldLabel, validate } from "@/tables/schema";
import { FieldInput } from "./field-input";
import { ValueView } from "./values";

/** Detail of the selected row, in the page: fiche (read) or form (write). */
export function RowPane({
  table,
  row,
  isNew,
  writable,
  onCreate,
  onUpdate,
  onDelete,
  onDone,
  uploadImage,
}: {
  table: TableDef;
  /** Selected row (null with isNew = new row). */
  row: Row | null;
  isNew: boolean;
  writable: boolean;
  onCreate: (row: Omit<Row, "id">) => Promise<Row>;
  onUpdate: (row: Partial<Row> & { id: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  /** After a create (with the new row) or a delete (null). */
  onDone: (row: Row | null) => void;
  uploadImage: (file: File) => Promise<string>;
}) {
  if (!row && !isNew)
    return (
      <p className="grid h-full place-items-center text-muted-foreground text-sm">
        Select a row
      </p>
    );
  const title = isNew ? "New row" : String(row!.name ?? row!.id);
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b px-5 py-3">
        <h2 className="font-title text-lg leading-tight">{title}</h2>
        {!isNew && !writable && <OptionSummary table={table} row={row!} />}
      </div>
      {writable ? (
        <RowForm
          key={row?.id ?? "new"}
          table={table}
          row={isNew ? null : row}
          onCreate={onCreate}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onDone={onDone}
          uploadImage={uploadImage}
        />
      ) : (
        <RowDetails table={table} row={row!} />
      )}
    </div>
  );
}

/** Option values of the row as badges, under the title. */
function OptionSummary({ table, row }: { table: TableDef; row: Row }) {
  const options = table.columns.filter(
    (f) => f.type === "option" && [row[f.name]].flat().filter(Boolean).length,
  );
  if (!options.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {options.map((field) => (
        <ValueView
          key={field.name}
          field={field}
          value={row[field.name] ?? null}
          full
        />
      ))}
    </div>
  );
}

/** Read mode: short fields on a two-column grid, long texts and images on full width. */
function RowDetails({ table, row }: { table: TableDef; row: Row }) {
  const wide = (f: Field) => f.type === "text" || f.type === "image";
  const short = table.columns.filter(
    (f) => !wide(f) && f.type !== "option" && f.name !== "name",
  );
  const long = table.columns.filter(wide);
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-5 py-2">
      <dl className="grid grid-cols-2 gap-x-6 border-b pb-2 lg:grid-cols-3">
        {short.map((field) => (
          <div key={field.name} className="py-1.5">
            <dt className="text-[11px] text-muted-foreground capitalize">
              {fieldLabel(field)}
            </dt>
            <dd className="mt-0.5 min-w-0 font-semibold text-[13px]">
              <ValueView field={field} value={row[field.name] ?? null} full />
            </dd>
          </div>
        ))}
      </dl>
      {long.map((field) => (
        <section key={field.name} className="mt-3 font-semibold text-[13px]">
          <h3 className="mb-1.5 text-[11px] text-muted-foreground capitalize">
            {fieldLabel(field)}
          </h3>
          <ValueView field={field} value={row[field.name] ?? null} full />
        </section>
      ))}
    </div>
  );
}

function RowForm({
  table,
  row,
  onCreate,
  onUpdate,
  onDelete,
  onDone,
  uploadImage,
}: {
  table: TableDef;
  row: Row | null;
  onCreate: (row: Omit<Row, "id">) => Promise<Row>;
  onUpdate: (row: Partial<Row> & { id: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onDone: (row: Row | null) => void;
  uploadImage: (file: File) => Promise<string>;
}) {
  const [values, setValues] = useState<Record<string, Value>>(() =>
    Object.fromEntries(
      table.columns.map((f) => [
        f.name,
        row?.[f.name] ??
          (f.multiple ? [] : f.type === "boolean" ? false : null),
      ]),
    ),
  );
  const [saving, setSaving] = useState(false);
  const set = (name: string, value: Value) =>
    setValues((v) => ({ ...v, [name]: value }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = validate(table, values);
    if (problem) return void toast.error(problem);
    setSaving(true);
    try {
      if (row) {
        await onUpdate({ ...values, id: row.id });
        toast.success("Changes saved");
      } else {
        onDone(await onCreate(values));
        toast.success("Row added");
      }
    } catch (error) {
      toast.error("Save failed", {
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="flex min-h-0 flex-1 flex-col">
      <div className="grid flex-1 grid-cols-2 content-start gap-x-5 gap-y-3 overflow-y-auto px-5 py-3">
        {table.columns.map((field) => (
          <label
            key={field.name}
            className={cn(
              "block",
              (field.type === "text" ||
                field.type === "image" ||
                field.name === "name") &&
                "col-span-2",
            )}
          >
            <span className="mb-1 flex items-baseline gap-1 text-[11px] text-muted-foreground capitalize">
              {fieldLabel(field)}
              {field.required && <span className="text-gold">*</span>}
              {field.description && (
                <span className="ml-auto font-normal text-muted-foreground normal-case">
                  {field.description}
                </span>
              )}
            </span>
            <FieldInput
              field={field}
              value={values[field.name] ?? null}
              onChange={(v) => set(field.name, v)}
              uploadImage={
                table.images || DATA_MODE === "demo" ? uploadImage : undefined
              }
            />
          </label>
        ))}
      </div>
      <div className="flex items-center gap-2 border-t bg-background/60 px-5 py-2">
        {row && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2Icon /> Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this row?</AlertDialogTitle>
                <AlertDialogDescription>
                  "{String(row.name ?? row.id)}" will be removed from the Excel
                  file. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-white hover:bg-destructive/90"
                  onClick={() =>
                    onDelete(row.id)
                      .then(() => {
                        toast.success("Row deleted");
                        onDone(null);
                      })
                      .catch((error) =>
                        toast.error("Delete failed", {
                          description: String(error),
                        }),
                      )
                  }
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        <Button
          type="submit"
          disabled={saving}
          className="ml-auto min-w-36 text-[10px] uppercase tracking-[0.24em]"
        >
          {saving ? <Loader2Icon className="animate-spin" /> : <CheckIcon />}
          {row ? "Save" : "Add"}
        </Button>
      </div>
    </form>
  );
}

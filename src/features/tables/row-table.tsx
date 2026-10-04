import { CopyIcon, Loader2Icon, Trash2Icon, XIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
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
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { copyText, rowsToTsv } from "@/lib/csv";
import { cn } from "@/lib/utils";
import type { Field, Row } from "@/tables/schema";
import { fieldLabel } from "@/tables/schema";
import { ValueView } from "./values";

/**
 * Table view: every column, horizontal scroll when they do not fit, sticky header and first column.
 * Rows can be selected (one by one, or all the rows shown): copy them to the clipboard (pastes as a
 * table in Excel), or delete them in write mode.
 */
export function RowTable({
  rows,
  fields,
  writable,
  onDelete,
}: {
  rows: Row[];
  fields: readonly Field[];
  writable: boolean;
  onDelete: (id: string) => Promise<void>;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  // Only the rows still shown count (filters may have hidden some).
  const chosen = rows.filter((r) => selected.has(r.id));
  const all = rows.length > 0 && chosen.length === rows.length;
  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleAll = () =>
    setSelected(all ? new Set() : new Set(rows.map((r) => r.id)));

  const copy = async () => {
    try {
      await copyText(rowsToTsv(fields, chosen));
      toast.success(
        `${chosen.length} row${chosen.length === 1 ? "" : "s"} copied`,
        {
          description: "Paste them in Excel, Teams or an email.",
        },
      );
    } catch (error) {
      toast.error("Copy failed", { description: String(error) });
    }
  };

  const remove = async () => {
    setConfirm(false);
    setDeleting(0);
    let done = 0;
    try {
      for (const row of chosen) {
        await onDelete(row.id);
        setDeleting(++done);
      }
      toast.success(`${done} row${done === 1 ? "" : "s"} deleted`);
      setSelected(new Set());
    } catch (error) {
      toast.error(`Delete stopped after ${done} rows`, {
        description: String(error),
      });
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-max min-w-full border-separate border-spacing-0 text-[13px]">
          <thead className="sticky top-0 z-10 bg-background">
            <tr>
              <th className="sticky left-0 z-10 w-10 border-b bg-background px-3 py-2 text-left">
                <Checkbox
                  checked={all ? true : chosen.length ? "indeterminate" : false}
                  onCheckedChange={toggleAll}
                  aria-label="Select all the rows"
                />
              </th>
              {fields.map((field, i) => (
                <th
                  key={field.name}
                  className={cn(
                    "whitespace-nowrap border-b px-3 py-2 text-left font-normal text-[10px] text-muted-foreground uppercase tracking-[0.18em]",
                    i === 0 && "sticky left-10 z-10 bg-background",
                  )}
                >
                  {fieldLabel(field)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isSelected = selected.has(row.id);
              const cell = isSelected
                ? "bg-[color-mix(in_oklab,var(--gold)_9%,white)]"
                : "bg-white group-hover:bg-background/60";
              return (
                <tr
                  key={row.id}
                  className="group cursor-pointer"
                  onClick={() => toggle(row.id)}
                >
                  <td className={cn("sticky left-0 border-b px-3 py-2", cell)}>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggle(row.id)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label="Select the row"
                    />
                  </td>
                  {fields.map((field, i) => (
                    <td
                      key={field.name}
                      className={cn(
                        "max-w-72 border-b px-3 py-2 align-middle",
                        i === 0 && "sticky left-10 font-medium",
                        cell,
                      )}
                    >
                      <span className="flex min-w-0 items-center overflow-hidden whitespace-nowrap">
                        <ValueView
                          field={field}
                          value={row[field.name] ?? null}
                        />
                      </span>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Actions on the selection */}
      <AnimatePresence>
        {chosen.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.25 }}
            className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 border bg-white py-1 pr-1 pl-3 shadow-lg"
          >
            <span className="mr-2 text-xs tabular-nums">
              {chosen.length} selected
            </span>
            <Button variant="ghost" size="sm" onClick={() => void copy()}>
              <CopyIcon /> Copy
            </Button>
            {writable && (
              <Button
                variant="ghost"
                size="sm"
                disabled={deleting !== null}
                onClick={() => setConfirm(true)}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                {deleting !== null ? (
                  <Loader2Icon className="animate-spin" />
                ) : (
                  <Trash2Icon />
                )}
                {deleting !== null
                  ? `${deleting} / ${chosen.length}`
                  : "Delete"}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Clear the selection"
              onClick={() => setSelected(new Set())}
            >
              <XIcon />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {chosen.length} row{chosen.length === 1 ? "" : "s"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              They will be removed from the Excel file. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => void remove()}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

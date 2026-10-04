import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import type { Field, Row } from "@/tables/schema";
import { ValueView } from "./values";

/** Rows as a list: title, then the chosen fields underneath. */
export function RowList({
  rows,
  fields,
  selectedId,
  onSelect,
}: {
  rows: Row[];
  fields: Field[];
  selectedId?: string;
  onSelect: (row: Row) => void;
}) {
  return (
    <ul>
      {rows.map((row, i) => {
        const selected = row.id === selectedId;
        return (
          <motion.li
            key={row.id}
            layout="position"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: Math.min(i, 20) * 0.015 }}
          >
            <button
              type="button"
              onClick={() => onSelect(row)}
              className={cn(
                "relative block w-full border-b px-3.5 py-2 text-left transition-colors duration-300",
                selected ? "bg-background" : "hover:bg-background/50",
              )}
            >
              {selected && (
                <motion.span
                  layoutId="row-current"
                  className="absolute inset-y-0 left-0 w-0.5 bg-gold"
                  transition={{ duration: 0.4 }}
                />
              )}
              <span className="block truncate font-medium text-[13px]">
                {String(row.name ?? row.id)}
              </span>
              {fields.length > 0 && (
                <span className="mt-1 flex items-center gap-x-2 overflow-hidden whitespace-nowrap text-[11px] text-muted-foreground">
                  {fields.map((field) => (
                    <span
                      key={field.name}
                      className="flex min-w-0 shrink-0 items-center overflow-hidden last:shrink"
                    >
                      <ValueView
                        field={field}
                        value={row[field.name] ?? null}
                      />
                    </span>
                  ))}
                </span>
              )}
            </button>
          </motion.li>
        );
      })}
    </ul>
  );
}

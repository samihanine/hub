import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import type { Row, TableDef } from "@/tables/schema";
import { fieldLabel, findOption } from "@/tables/schema";
import { optionColor } from "./values";

/**
 * One segment per value of the table's KPI field (schema `kpi`): number of rows having it.
 * Clicking a card filters the rows on that value (click again to remove the filter).
 */
export function KpiBar({
  table,
  rows,
  selected,
  onToggle,
}: {
  table: TableDef;
  /** Rows after search and other filters (the KPI field's own filter excluded). */
  rows: Row[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  const field = table.columns.find((f) => f.name === table.kpi?.field);
  if (!field) return null;
  const values = table.kpi?.values ?? (field.options ?? []).map((o) => o.value);
  const count = (value: string) =>
    rows.filter((row) => [row[field.name]].flat().map(String).includes(value))
      .length;

  return (
    // One compact strip: a segment per value (label, count, share bar), click = filter.
    <div
      className="grid divide-x border"
      style={{
        gridTemplateColumns: `repeat(${values.length}, minmax(0, 1fr))`,
      }}
    >
      {values.map((value, i) => {
        const active = selected.includes(value);
        const n = count(value);
        const share = rows.length ? Math.round((n / rows.length) * 100) : 0;
        const option = findOption(field, value);
        const color = optionColor(option);
        return (
          <motion.button
            key={value}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.05, duration: 0.4 }}
            onClick={() => onToggle(value)}
            title={`${fieldLabel(field)}: ${option.label ?? value}`}
            className={cn(
              "relative flex h-14 items-center gap-3 px-4 text-left transition-colors duration-300",
              active ? "bg-background" : "bg-white hover:bg-background/50",
            )}
          >
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="min-w-0 flex-1 truncate text-muted-foreground text-sm">
              {option.label ?? value}
            </span>
            <motion.span
              key={n}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-title text-3xl tabular-nums leading-none"
              style={{ color }}
            >
              {n}
            </motion.span>
            <span className="absolute inset-x-0 bottom-0 h-0.5">
              <motion.span
                className="block h-full"
                style={{ backgroundColor: color, opacity: active ? 1 : 0.5 }}
                initial={{ width: 0 }}
                animate={{ width: `${share}%` }}
                transition={{ duration: 0.8 }}
              />
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

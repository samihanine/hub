import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckIcon,
  ChevronDownIcon,
  ExternalLinkIcon,
  PlusIcon,
  RefreshCwIcon,
  RowsIcon,
  SearchIcon,
  Table2Icon,
  UploadIcon,
  XIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Sort, TableView } from "@/lib/table-view";
import { defaultColumns } from "@/lib/table-view";
import { cn } from "@/lib/utils";
import type { TableDef } from "@/tables/schema";
import { fieldLabel } from "@/tables/schema";
import { CheckList } from "./check-list";
import { OptionBadge } from "./values";

const TYPE_LABELS = {
  string: "text",
  text: "long",
  number: "number",
  boolean: "yes/no",
  option: "choice",
  date: "date",
  url: "link",
  image: "image",
};

/** Search and filters, on the whole width. */
export function Filters({
  table,
  view,
  onChange,
  hasFilters,
  onClear,
}: {
  table: TableDef;
  view: TableView;
  onChange: (patch: Partial<TableView>) => void;
  hasFilters: boolean;
  onClear: () => void;
}) {
  const optionFields = table.columns.filter((f) => f.type === "option");
  const booleanFields = table.columns.filter((f) => f.type === "boolean");
  const filter = "h-9 min-w-32 flex-1 gap-2 px-3 text-[10.5px]";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="relative flex h-9 w-full items-center sm:w-auto sm:flex-[2]">
        <SearchIcon
          className="pointer-events-none absolute left-1 size-4 text-muted-foreground"
          strokeWidth={1.5}
        />
        <input
          value={view.search}
          onChange={(e) => onChange({ search: e.target.value })}
          placeholder="Search…"
          className="h-full w-full border-input border-b bg-transparent pr-7 pl-8 text-sm outline-none placeholder:text-muted-foreground focus:border-gold"
        />
        {view.search && (
          <button
            type="button"
            onClick={() => onChange({ search: "" })}
            className="absolute right-2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <XIcon className="size-3.5" />
          </button>
        )}
      </label>

      {optionFields.map((field) => (
        <CheckList
          key={field.name}
          label={fieldLabel(field)}
          className={filter}
          items={(field.options ?? []).map((option) => ({
            value: option.value,
            label: <OptionBadge option={option} />,
          }))}
          selected={view.options[field.name] ?? []}
          onChange={(selected) =>
            onChange({ options: { ...view.options, [field.name]: selected } })
          }
        />
      ))}
      {booleanFields.length > 0 && (
        <CheckList
          label="Only"
          className={filter}
          items={booleanFields.map((field) => ({
            value: field.name,
            label: <span className="capitalize">{fieldLabel(field)}</span>,
          }))}
          selected={view.flags}
          onChange={(flags) => onChange({ flags })}
        />
      )}
      {hasFilters && (
        <Button
          variant="ghost"
          onClick={onClear}
          className="h-9 text-muted-foreground"
        >
          <XIcon /> Clear
        </Button>
      )}
    </div>
  );
}

export type Layout = "list" | "table";

/** Row count, sort, fields, layout, refresh / Excel, import and add: on the right of the title. */
export function TableActions({
  table,
  view,
  onChange,
  count,
  total,
  refreshing,
  onRefresh,
  layout,
  onLayout,
  onImport,
  onAdd,
}: {
  table: TableDef;
  view: TableView;
  onChange: (patch: Partial<TableView>) => void;
  count: number;
  total: number;
  refreshing: boolean;
  onRefresh: () => void;
  layout: Layout;
  onLayout: (layout: Layout) => void;
  /** Only in write mode. */
  onImport?: () => void;
  onAdd?: () => void;
}) {
  const columns = view.columns ?? defaultColumns(table);
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-2 text-[10px] text-muted-foreground uppercase tabular-nums tracking-[0.2em]">
        {count === total
          ? `${total} row${total === 1 ? "" : "s"}`
          : `${count} / ${total}`}
      </span>
      <SortMenu
        table={table}
        sort={view.sort}
        onChange={(sort) => onChange({ sort })}
      />
      {layout === "list" && (
        <CheckList
          label="Fields"
          highlight={false}
          items={table.columns.map((field) => ({
            value: field.name,
            label: <span className="capitalize">{fieldLabel(field)}</span>,
            hint: TYPE_LABELS[field.type],
          }))}
          selected={columns}
          onChange={(selected) =>
            onChange({
              columns: table.columns
                .map((f) => f.name)
                .filter((name) => selected.includes(name)),
            })
          }
          footer={
            view.columns && (
              <button
                type="button"
                onClick={() => onChange({ columns: null })}
                className="rounded px-2 py-1 text-muted-foreground text-xs hover:bg-muted hover:text-foreground"
              >
                Default
              </button>
            )
          }
        />
      )}
      <div className="ml-1 flex border" role="group" aria-label="Layout">
        {(
          [
            ["list", "List and details", RowsIcon],
            ["table", "Table (every column)", Table2Icon],
          ] as const
        ).map(([value, label, Icon]) => (
          <Tooltip key={value}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => onLayout(value)}
                aria-label={label}
                aria-pressed={layout === value}
                className={cn(
                  "grid size-7 place-items-center transition-colors",
                  layout === value
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-gold",
                )}
              >
                <Icon className="size-3.5" strokeWidth={1.5} />
              </button>
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
          </Tooltip>
        ))}
      </div>
      <IconButton label="Refresh" onClick={onRefresh}>
        <RefreshCwIcon className={cn(refreshing && "animate-spin")} />
      </IconButton>
      {table.excel.url && (
        <IconButton
          label="Open in Excel"
          onClick={() => window.open(table.excel.url, "_blank", "noreferrer")}
        >
          <ExternalLinkIcon />
        </IconButton>
      )}
      {onImport && (
        <IconButton label="Import a CSV" onClick={onImport}>
          <UploadIcon />
        </IconButton>
      )}
      {onAdd && (
        <Button
          size="sm"
          onClick={onAdd}
          className="ml-1 h-7 px-3 text-[9.5px] uppercase tracking-[0.22em]"
        >
          <PlusIcon /> Add
        </Button>
      )}
    </div>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClick}
          aria-label={label}
          className="text-muted-foreground hover:bg-transparent hover:text-gold [&_svg]:stroke-[1.5]"
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/** Sort field + direction (default comes from the table schema). */
function SortMenu({
  table,
  sort,
  onChange,
}: {
  table: TableDef;
  sort: Sort;
  onChange: (sort: Sort) => void;
}) {
  const current = table.columns.find((f) => f.name === sort?.column);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex h-7 items-center gap-1.5 border border-border px-2.5 text-[9.5px] text-muted-foreground uppercase tracking-[0.18em] transition-colors hover:border-gold/60 hover:text-foreground"
        >
          Sort
          {current && (
            <span className="text-foreground">: {fieldLabel(current)}</span>
          )}
          {sort &&
            (sort.direction === "asc" ? (
              <ArrowUpIcon className="size-3" />
            ) : (
              <ArrowDownIcon className="size-3" />
            ))}
          <ChevronDownIcon className="size-3 opacity-60" strokeWidth={1.5} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-1">
        <div className="flex border-b pb-1">
          {(["asc", "desc"] as const).map((direction) => (
            <button
              type="button"
              key={direction}
              disabled={!sort}
              onClick={() => sort && onChange({ ...sort, direction })}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 py-1.5 text-xs disabled:opacity-40",
                sort?.direction === direction
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {direction === "asc" ? (
                <ArrowUpIcon className="size-3" />
              ) : (
                <ArrowDownIcon className="size-3" />
              )}
              {direction === "asc" ? "Ascending" : "Descending"}
            </button>
          ))}
        </div>
        <div className="max-h-64 overflow-y-auto pt-1">
          {[
            { name: "", label: "No sorting" },
            ...table.columns.map((f) => ({
              name: f.name,
              label: fieldLabel(f),
            })),
          ].map((option) => {
            const active = (sort?.column ?? "") === option.name;
            return (
              <button
                type="button"
                key={option.name || "none"}
                onClick={() =>
                  onChange(
                    option.name
                      ? {
                          column: option.name,
                          direction: sort?.direction ?? "asc",
                        }
                      : null,
                  )
                }
                className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[13px] capitalize hover:bg-muted"
              >
                <CheckIcon
                  className={cn("size-3.5 text-gold", !active && "invisible")}
                />
                {option.label}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

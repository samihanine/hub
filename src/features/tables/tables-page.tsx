import { Link, useSearch } from "@tanstack/react-router";
import {
  ArrowLeftIcon,
  LockIcon,
  RotateCcwIcon,
  SearchXIcon,
  TableIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { LoadingScreen } from "@/components/loading-screen";
import { NotFound } from "@/components/not-found";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DATA_MODE, useCurrentUser } from "@/lib/power-apps";
import { resetDemo, useRows } from "@/lib/rows";
import { applyView, useTableView, visibleFields } from "@/lib/table-view";
import { useLocalState } from "@/lib/use-local-state";
import { findTable } from "@/tables";
import type { TableDef } from "@/tables/schema";
import { canWrite } from "@/tables/schema";
import { CsvImport } from "./csv-import";
import { Filters, type Layout, TableActions } from "./filter-bar";
import { KpiBar } from "./kpi-bar";
import { RowList } from "./row-list";
import { RowPane } from "./row-pane";
import { RowTable } from "./row-table";

export function TablesPage() {
  const { name, role } = useSearch({ from: "/tables" });
  const table = findTable(name);
  if (!table)
    return (
      <NotFound title="Unknown table">
        {name ? (
          <>
            No table "{name}" is declared in <code>src/tables</code>.
          </>
        ) : (
          <>
            Specify the table in the URL: <code>?name=…</code>
          </>
        )}
      </NotFound>
    );
  return <TableView key={table.name} table={table} role={role} />;
}

function TableView({
  table,
  role,
}: {
  table: TableDef;
  role: "read" | "write";
}) {
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const allowed = canWrite(table, user?.email);
  const writable = role === "write" && allowed;
  const rows = useRows(table);
  const { view, change, clearFilters, hasFilters } = useTableView(table);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [importing, setImporting] = useState(false);
  const [layout, setLayout] = useLocalState<Layout>(
    `hub:table-layout:${table.name}`,
    "list",
  );

  const visible = useMemo(() => applyView(rows.rows, view), [rows.rows, view]);
  const kpiField = table.kpi?.field;
  // KPI counts ignore their own filter, so every card keeps its number when one is selected.
  const kpiRows = useMemo(
    () =>
      kpiField
        ? applyView(rows.rows, {
            ...view,
            options: { ...view.options, [kpiField]: [] },
            sort: null,
          })
        : [],
    [rows.rows, view, kpiField],
  );
  const fields = visibleFields(table, view).filter((f) => f.name !== "name");
  const selected = isNew
    ? null
    : (visible.find((r) => r.id === selectedId) ?? visible[0] ?? null);
  const Icon = table.icon ?? TableIcon;

  const toggleKpi = (value: string) => {
    if (!kpiField) return;
    const current = view.options[kpiField] ?? [];
    change({
      options: {
        ...view.options,
        [kpiField]: current.length === 1 && current[0] === value ? [] : [value],
      },
    });
  };

  // Error / loading / empty states, shared by both layouts (null = there are rows to show).
  const placeholder = rows.error ? (
    <ErrorState error={rows.error} table={table} />
  ) : rows.isLoading ? (
    <div className="space-y-2 p-4">
      {Array.from({ length: 8 }, (_, i) => (
        <Skeleton key={i} className="h-14" style={{ opacity: 1 - i * 0.1 }} />
      ))}
    </div>
  ) : !visible.length ? (
    <div className="grid h-64 place-items-center p-6 text-center text-muted-foreground text-sm">
      <div>
        <SearchXIcon
          className="mx-auto mb-3 size-6 text-gold"
          strokeWidth={1.25}
        />
        {rows.rows.length ? "No rows match the filters" : "No rows yet"}
        {hasFilters && (
          <Button
            variant="link"
            size="sm"
            onClick={clearFilters}
            className="mx-auto block"
          >
            Clear filters
          </Button>
        )}
      </div>
    </div>
  ) : null;

  return (
    <div className="mx-auto flex h-dvh w-full max-w-6xl flex-col gap-3 px-4 py-5 sm:px-6">
      <LoadingScreen
        show={rows.isLoading}
        label={`Loading ${table.label.toLowerCase()}`}
      />
      <div className="flex flex-wrap items-center gap-4">
        <Link
          to="/"
          className="grid size-7 place-items-center rounded-full border text-muted-foreground transition-colors hover:border-gold hover:text-gold"
          aria-label="Home"
        >
          <ArrowLeftIcon className="size-4" strokeWidth={1.25} />
        </Link>
        <Icon className="size-6 text-gold" strokeWidth={1.25} />
        <h1 className="font-title text-2xl leading-none">{table.label}</h1>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {DATA_MODE === "demo" && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]"
                  onClick={() => {
                    resetDemo(table);
                    void rows.refresh();
                  }}
                >
                  <RotateCcwIcon /> Demo data
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reset the demo rows</TooltipContent>
            </Tooltip>
          )}
          <TableActions
            table={table}
            view={view}
            onChange={change}
            count={visible.length}
            total={rows.rows.length}
            refreshing={rows.isFetching}
            onRefresh={() => void rows.refresh()}
            layout={layout}
            onLayout={setLayout}
            onImport={writable ? () => setImporting(true) : undefined}
            onAdd={
              writable
                ? () => {
                    setLayout("list");
                    setIsNew(true);
                  }
                : undefined
            }
          />
        </div>
      </div>

      {role === "write" && !allowed && !userLoading && (
        <div className="flex items-center gap-3 border-gold border-l-2 bg-background px-3 py-2 text-muted-foreground text-xs">
          <LockIcon className="size-4 shrink-0 text-gold" strokeWidth={1.5} />
          {user?.email ? (
            <>"{user.email}" cannot edit this table: read-only view.</>
          ) : (
            <>Unidentified user: read-only view.</>
          )}
        </div>
      )}

      <Filters
        table={table}
        view={view}
        onChange={change}
        hasFilters={hasFilters}
        onClear={clearFilters}
      />

      {!rows.isLoading && !rows.error && (
        <KpiBar
          table={table}
          rows={kpiRows}
          selected={kpiField ? (view.options[kpiField] ?? []) : []}
          onToggle={toggleKpi}
        />
      )}

      {layout === "table" ? (
        <div className="min-h-0 flex-1 overflow-hidden border">
          {placeholder ?? (
            <RowTable
              rows={visible}
              fields={table.columns}
              writable={writable}
              onDelete={rows.remove}
            />
          )}
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 gap-3 md:grid-cols-[minmax(15rem,20rem)_1fr]">
          <div className="min-h-0 overflow-y-auto border max-md:h-56">
            {placeholder ?? (
              <RowList
                rows={visible}
                fields={fields}
                selectedId={isNew ? undefined : selected?.id}
                onSelect={(row) => {
                  setIsNew(false);
                  setSelectedId(row.id);
                }}
              />
            )}
          </div>
          <div className="min-h-0 overflow-hidden border max-md:min-h-96">
            <RowPane
              table={table}
              row={selected}
              isNew={isNew}
              writable={writable}
              onCreate={rows.insert}
              onUpdate={rows.update}
              onDelete={rows.remove}
              onDone={(row) => {
                setIsNew(false);
                setSelectedId(row?.id ?? null);
              }}
              uploadImage={rows.uploadImage}
            />
          </div>
        </div>
      )}

      {writable && (
        <CsvImport
          table={table}
          open={importing}
          onOpenChange={setImporting}
          onInsert={rows.insert}
        />
      )}
    </div>
  );
}

function ErrorState({ error, table }: { error: Error; table: TableDef }) {
  return (
    <div className="grid h-64 place-items-center p-6 text-center">
      <div className="max-w-md">
        <TriangleAlertIcon
          className="mx-auto mb-4 size-6 text-gold"
          strokeWidth={1.25}
        />
        <p className="font-title text-lg">
          Unable to read the Excel table "{table.excel.table}"
        </p>
        <p className="mt-1 break-words text-muted-foreground text-sm">
          {error.message}
        </p>
        <p className="mt-3 text-muted-foreground text-xs">
          Check the location (<code>excel.url</code>, <code>excel.table</code>)
          declared in <code>src/tables/{table.name}.ts</code>.
        </p>
      </div>
    </div>
  );
}

import { CheckIcon, ChevronDownIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type Item = { value: string; label: React.ReactNode; hint?: string };

/** Button opening a multi-select list (option filters, visible columns). */
export function CheckList({
  label,
  items,
  selected,
  onChange,
  highlight = true,
  footer,
  className,
}: {
  label: string;
  items: Item[];
  selected: string[];
  onChange: (selected: string[]) => void;
  /** Tint the button when something is selected. */
  highlight?: boolean;
  footer?: React.ReactNode;
  /** Extra classes of the button (size, width). */
  className?: string;
}) {
  const active = highlight && selected.length > 0;
  const toggle = (value: string) =>
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value],
    );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-7 items-center gap-1.5 border px-2.5 text-[9.5px] uppercase tracking-[0.18em] transition-colors",
            active
              ? "border-gold text-foreground"
              : "border-border text-muted-foreground hover:border-gold/60 hover:text-foreground",
            className,
          )}
        >
          {label}
          {active && (
            <span className="grid h-4 min-w-4 place-items-center rounded-full bg-gold px-1 text-[9px] text-white tracking-normal">
              {selected.length}
            </span>
          )}
          <ChevronDownIcon
            className="ml-auto size-3 opacity-60"
            strokeWidth={1.5}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-60 p-1">
        <div className="max-h-72 overflow-y-auto">
          {items.map((item) => {
            const checked = selected.includes(item.value);
            return (
              <button
                type="button"
                key={item.value}
                onClick={() => toggle(item.value)}
                className="flex w-full items-center gap-3 px-2.5 py-2 text-left text-[13px] hover:bg-muted"
              >
                <span
                  className={cn(
                    "grid size-4 shrink-0 place-items-center border transition-colors",
                    checked ? "border-gold bg-gold text-white" : "border-input",
                  )}
                >
                  {checked && <CheckIcon className="size-3" strokeWidth={3} />}
                </span>
                <span className="flex min-w-0 flex-1 items-center">
                  {item.label}
                </span>
                {item.hint && (
                  <span className="text-[11px] text-muted-foreground">
                    {item.hint}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {(selected.length > 0 || footer) && (
          <div className="mt-1 flex items-center justify-between border-t px-1 pt-1">
            {footer}
            {highlight && selected.length > 0 && (
              <button
                type="button"
                onClick={() => onChange([])}
                className="ml-auto rounded px-2 py-1 text-muted-foreground text-xs hover:bg-muted hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

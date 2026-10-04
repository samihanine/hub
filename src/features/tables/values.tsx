import { CheckIcon, ExternalLinkIcon, MinusIcon } from "lucide-react";
import { SpImage } from "@/components/sp-image";
import { cn } from "@/lib/utils";
import type { Field, Option, OptionColor, Value } from "@/tables/schema";
import { findOption } from "@/tables/schema";

/** Muted, earthy tones for options. */
const OPTION_HEX: Record<OptionColor, string> = {
  gray: "#8f877a",
  red: "#a8483a",
  orange: "#b86f32",
  yellow: "#a8841f",
  lime: "#76813a",
  green: "#557550",
  teal: "#41716c",
  cyan: "#4e7d8c",
  blue: "#4a6389",
  indigo: "#545487",
  violet: "#74557f",
  pink: "#a5606f",
};

export const optionColor = (option: Option) =>
  OPTION_HEX[option.color ?? "gray"];

/** Option label on a tint of its color. */
export function OptionBadge({
  option,
  className,
}: {
  option: Option;
  className?: string;
}) {
  const color = optionColor(option);
  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center whitespace-nowrap rounded-sm px-2 font-medium text-[11px]",
        className,
      )}
      style={{
        color,
        backgroundColor: `color-mix(in oklab, ${color} 14%, white)`,
      }}
    >
      {option.label ?? option.value}
    </span>
  );
}

const list = (value: Value) =>
  [value].flat().filter((v) => v !== null && v !== undefined && v !== "") as (
    | string
    | number
    | boolean
  )[];

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});
export const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : dateFormat.format(date);
};

/** Strips the light markdown (**bold**) used in text fields. */
export const plain = (text: string) => text.replace(/\*\*/g, "");

/** Text with **bold** and line breaks. */
export function RichText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return (
    <p className={cn("whitespace-pre-line", className)}>
      {text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i} className="font-bold text-foreground">
            {part.slice(2, -2)}
          </strong>
        ) : (
          part
        ),
      )}
    </p>
  );
}

/** Read-only display of a value, compact (table cell) or full (detail panel). */
export function ValueView({
  field,
  value,
  full = false,
}: {
  field: Field;
  value: Value;
  full?: boolean;
}) {
  const values = list(value);
  if (!values.length && field.type !== "boolean")
    return full ? <span className="text-muted-foreground/60">—</span> : null;

  switch (field.type) {
    case "option":
      return (
        <span
          className={cn("flex gap-1", full ? "flex-wrap" : "overflow-hidden")}
        >
          {values.map((v) => (
            <OptionBadge
              key={String(v)}
              option={findOption(field, String(v))}
            />
          ))}
        </span>
      );
    case "boolean":
      return value === true ? (
        <span className="inline-grid size-5 place-items-center rounded-full border border-gold text-gold">
          <CheckIcon className="size-3" strokeWidth={2} />
        </span>
      ) : (
        <span className="inline-grid size-5 place-items-center text-muted-foreground/40">
          <MinusIcon className="size-3" strokeWidth={1.25} />
        </span>
      );
    case "date":
      return (
        <span className="tabular-nums">
          {values.map((v) => formatDate(String(v))).join(", ")}
        </span>
      );
    case "number":
      return (
        <span className="tabular-nums">
          {values.map((v) => Number(v).toLocaleString("en-US")).join(", ")}
        </span>
      );
    case "url":
      return (
        <span
          className={cn("flex gap-2", full ? "flex-col" : "overflow-hidden")}
        >
          {values.map((v) => (
            <a
              key={String(v)}
              href={String(v)}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex min-w-0 items-center gap-1 text-gold underline-offset-4 hover:underline"
            >
              <span className="truncate">
                {full ? String(v) : hostOf(String(v))}
              </span>
              <ExternalLinkIcon className="size-3 shrink-0" />
            </a>
          ))}
        </span>
      );
    case "image":
      return (
        <span className="flex gap-2">
          {values.map((v) => (
            <SpImage
              key={String(v)}
              src={String(v)}
              className={cn(
                "object-cover ring-1 ring-border",
                full ? "max-h-72 min-h-24 w-full object-contain" : "size-7",
              )}
            />
          ))}
        </span>
      );
    case "text":
      return full ? (
        <RichText
          text={String(values[0])}
          className="text-muted-foreground text-sm leading-relaxed"
        />
      ) : (
        <span className="truncate text-muted-foreground">
          {plain(String(values[0]))}
        </span>
      );
    default:
      return <span className="truncate">{values.join(", ")}</span>;
  }
}

const hostOf = (url: string) => {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
};

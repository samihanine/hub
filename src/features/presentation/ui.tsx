import {
  ChartLineIcon,
  type LucideIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { motion, type Variants } from "motion/react";
import { createContext, useContext } from "react";
import { cn } from "@/lib/utils";
import type { Point } from "@/presentations/types";

/*
 * Shared building blocks of the slide layouts. House style: white page, Futura titles, Century Gothic
 * text, widely spaced small capitals, gold hairlines. Sizes are in cqw (1% of the stage width).
 */

export const ease = [0.22, 1, 0.36, 1] as const;

/** Content area of slides with the header (logo + title) and the page number. */
export const CONTENT =
  "absolute top-[8.4cqw] bottom-[3.6cqw] left-[4cqw] right-[4cqw]";

export const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.2 } },
};

export const item: Variants = {
  hidden: { opacity: 0, y: 12, filter: "blur(3px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 1, ease },
  },
};

/**
 * Still mode (PDF export): slides are drawn directly in their final state, without entrance
 * animations.
 */
export const StillContext = createContext(false);
export const useStill = () => useContext(StillContext);

/**
 * Props of an item revealed step by step: hidden until `step` reaches it (one item per click / key).
 * Use with the `steps` of the layout.
 */
export function revealed(i: number, step: number, still: boolean) {
  return {
    variants: item,
    initial: still ? false : ("hidden" as const),
    animate: i < step ? ("show" as const) : ("hidden" as const),
  };
}

/** Root of a layout: runs the staggered entrance of its children. */
export function Page({
  className,
  style,
  children,
}: {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const still = useStill();
  return (
    <motion.div
      variants={container}
      initial={still ? false : "hidden"}
      animate="show"
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

/** Responsive Unsplash url (any other url is returned untouched). */
export const picture = (url: string, width = 1800) =>
  url.includes("images.unsplash.com") && !url.includes("?")
    ? `${url}?w=${width}&q=80&auto=format&fit=crop`
    : url;

/** Inline text: **bold**, ==gold==, *italic*, line breaks. */
export function Rich({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return (
    <span className={cn("whitespace-pre-line", className)}>
      {text.split(/(\*\*[^*]+\*\*|==[^=]+==|\*[^*]+\*)/g).map((part, i) =>
        part.startsWith("**") ? (
          <strong key={i} className="font-semibold text-foreground">
            {part.slice(2, -2)}
          </strong>
        ) : part.startsWith("==") ? (
          <strong key={i} className="font-semibold text-[var(--tone)]">
            {part.slice(2, -2)}
          </strong>
        ) : part.length > 2 && part.startsWith("*") && part.endsWith("*") ? (
          <em key={i} className="italic">
            {part.slice(1, -1)}
          </em>
        ) : (
          part
        ),
      )}
    </span>
  );
}

/** Minimal markdown: paragraphs (blank line), "- " lists, "## " / "### " headings, "> " quotes, inline Rich. */
export function Markdown({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const blocks = text.trim().split(/\n\s*\n/);
  return (
    <div className={cn("space-y-[0.9cqw]", className)}>
      {blocks.map((block, b) => {
        const lines = block
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);
        if (lines.every((l) => l.startsWith("- ")))
          return (
            <ul key={b} className="space-y-[0.5cqw]">
              {lines.map((l) => (
                <li key={l} className="flex items-start gap-[0.9cqw]">
                  <span className="mt-[0.7cqw] h-px w-[1cqw] shrink-0 bg-[var(--tone)]" />
                  <Rich text={l.slice(2)} />
                </li>
              ))}
            </ul>
          );
        if (lines[0].startsWith("## "))
          return (
            <h3 key={b} className="font-title text-[1.8cqw] leading-tight">
              {lines[0].slice(3)}
            </h3>
          );
        if (lines[0].startsWith("### "))
          return (
            <p
              key={b}
              className="text-[0.78cqw] text-[var(--tone)] uppercase tracking-[0.26em]"
            >
              {lines[0].slice(4)}
            </p>
          );
        if (lines.every((l) => l.startsWith("> ")))
          return (
            <blockquote
              key={b}
              className="border-[var(--tone)] border-l pl-[1.4cqw] font-title text-[1.4cqw] italic"
            >
              <Rich text={lines.map((l) => l.slice(2)).join(" ")} />
            </blockquote>
          );
        return (
          <p key={b}>
            <Rich text={lines.join(" ")} />
          </p>
        );
      })}
    </div>
  );
}

/** Display title revealed word by word. */
export function RevealTitle({
  text,
  className,
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.h2
      className={cn(
        "text-balance font-normal font-title tracking-[-0.01em]",
        className,
      )}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.05, delayChildren: delay } },
      }}
    >
      {text.split(" ").map((word, i) => (
        <span
          key={i}
          className="-mb-[0.16em] inline-block overflow-hidden pb-[0.16em] align-bottom"
        >
          <motion.span
            className="inline-block"
            variants={{
              hidden: { y: "110%" },
              show: { y: "0%", transition: { duration: 1.2, ease } },
            }}
          >
            {word}
            {" "}
          </motion.span>
        </span>
      ))}
    </motion.h2>
  );
}

export const Eyebrow = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <motion.p
    variants={item}
    className={cn(
      "text-[0.8cqw] text-muted-foreground uppercase tracking-[0.32em]",
      className,
    )}
  >
    {children}
  </motion.p>
);

/** Short gold rule, drawn from the left. */
export const Rule = ({ className }: { className?: string }) => (
  <motion.span
    variants={{
      hidden: { scaleX: 0 },
      show: { scaleX: 1, transition: { duration: 1.2, ease } },
    }}
    className={cn(
      "block h-px w-[2.6cqw] origin-left bg-[var(--tone)]",
      className,
    )}
  />
);

export const pad = (n: number) => String(n).padStart(2, "0");

/** Number in a hairline circle (or filled). */
export const Num = ({
  n,
  filled = false,
  className,
}: {
  n: number;
  filled?: boolean;
  className?: string;
}) => (
  <span
    className={cn(
      "grid size-[2.4cqw] shrink-0 place-items-center rounded-full font-title text-[1cqw]",
      filled
        ? "bg-[var(--tone)] text-white shadow-[0_0.3cqw_0.8cqw_-0.3cqw_var(--tone)]"
        : "border border-[var(--tone)]/70 text-[var(--tone)]",
      className,
    )}
  >
    {pad(n)}
  </span>
);

/** Height of the lead band, so absolutely placed content (visual panel, report) can sit under it. */
export const BAND_TOP = "top-[8.4cqw]";
export const UNDER_BAND = "top-[14.8cqw]";

/**
 * Key sentence of a content slide, shown in the lead band. Either the text alone, or the text with
 * its icon (any lucide icon, a chart by default) and the icon colour (gold by default), to suit the page.
 */
export type Lead = string | { text: string; icon?: LucideIcon; color?: string };

/** Lead band shared by content slides: a coloured icon + the key sentence. */
export function LeadBand({
  lead,
  className,
}: {
  lead: Lead;
  className?: string;
}) {
  const {
    text,
    icon: Icon = ChartLineIcon,
    color = "var(--tone)",
  } = typeof lead === "string" ? { text: lead } : lead;
  return (
    <motion.div
      variants={item}
      className={cn(
        "flex h-[4cqw] shrink-0 items-center gap-[1.4cqw] bg-background/80 px-[1.6cqw]",
        className,
      )}
    >
      <Icon
        className="size-[1.9cqw] shrink-0"
        style={{ color }}
        strokeWidth={1.4}
      />
      <p className="min-w-0 text-[1.2cqw] leading-snug">
        <Rich text={text} />
      </p>
    </motion.div>
  );
}

export const asPoint = (point: Point): Exclude<Point, string> =>
  typeof point === "string" ? { title: point } : point;

/** Title (with alert icon), text and sub-points of a point. */
export function PointBody({
  point,
  size = "md",
}: {
  point: Exclude<Point, string>;
  size?: "sm" | "md";
}) {
  return (
    <div className="min-w-0">
      <p
        className={cn(
          "flex items-center gap-[0.7cqw] font-semibold",
          size === "sm" ? "text-[1.02cqw]" : "text-[1.3cqw]",
        )}
      >
        {point.warning && (
          <TriangleAlertIcon
            className="size-[1.1cqw] shrink-0 text-[var(--tone)]"
            strokeWidth={1.5}
          />
        )}
        <Rich text={point.title} />
      </p>
      {point.text && (
        <p
          className={cn(
            "mt-[0.3cqw] text-muted-foreground leading-relaxed",
            size === "sm" ? "text-[0.92cqw]" : "text-[1.1cqw]",
          )}
        >
          <Rich text={point.text} />
        </p>
      )}
      {!!point.items?.length && (
        <ul className="mt-[0.5cqw] space-y-[0.3cqw]">
          {point.items.map((entry) => (
            <li
              key={entry}
              className={cn(
                "flex items-start gap-[0.8cqw] text-foreground/80",
                size === "sm" ? "text-[0.88cqw]" : "text-[1.02cqw]",
              )}
            >
              <span className="mt-[0.6cqw] h-px w-[0.9cqw] shrink-0 bg-[var(--tone)]" />
              <Rich text={entry} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

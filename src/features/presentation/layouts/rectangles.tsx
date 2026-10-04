import type { LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import {
  CONTENT,
  container,
  type Lead,
  LeadBand,
  Markdown,
  Page,
  revealed,
  useStill,
} from "../ui";
import { defineLayout } from "./define";

/** Two to four tall cards side by side (pages of the report, users…). `text` is markdown. */
export type RectanglesSlide = {
  layout: "rectangles";
  title: string;
  lead: Lead;
  items: {
    title: string;
    text?: string;
    items?: string[];
    icon?: LucideIcon;
  }[];
};

const COLUMNS = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
} as Record<number, string>;

export const rectangles = defineLayout<RectanglesSlide>({
  chrome: true,
  steps: (slide) => slide.items.length,
  Component: ({ slide, step }) => <Rectangles slide={slide} step={step} />,
});

function Rectangles({ slide, step }: { slide: RectanglesSlide; step: number }) {
  const still = useStill();
  return (
    <Page className={cn(CONTENT, "flex flex-col")}>
      <LeadBand lead={slide.lead} />
      <motion.div
        variants={container}
        className={cn(
          "mt-[2.8cqw] grid min-h-0 flex-1 gap-[1.6cqw]",
          COLUMNS[slide.items.length] ?? "grid-cols-3",
        )}
      >
        {slide.items.map(({ title, text, items, icon: Icon }, i) => (
          <motion.div
            key={title}
            {...revealed(i, step, still)}
            className="relative flex flex-col bg-background px-[2.2cqw] pt-[2.4cqw] pb-[2cqw]"
          >
            {Icon && (
              <Icon
                className="size-[2.6cqw] text-[var(--tone)]"
                strokeWidth={0.9}
              />
            )}
            <p
              className={cn(
                "font-title text-[1.95cqw] leading-snug",
                Icon && "mt-[1.6cqw]",
              )}
            >
              {title}
            </p>
            {text && (
              <Markdown
                text={text}
                className="mt-[1cqw] text-[1.12cqw] text-foreground/80 leading-relaxed"
              />
            )}
            {!!items?.length && (
              <Markdown
                text={items.map((entry) => `- ${entry}`).join("\n")}
                className="mt-[1cqw] text-[1.1cqw] leading-snug"
              />
            )}
          </motion.div>
        ))}
      </motion.div>
    </Page>
  );
}

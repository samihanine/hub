import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import type { Point } from "@/presentations/types";
import {
  asPoint,
  CONTENT,
  container,
  type Lead,
  LeadBand,
  Num,
  Page,
  Rich,
  revealed,
  useStill,
} from "../ui";
import { defineLayout } from "./define";

/**
 * Key points (up to 8): the lead band, then numbered points — "**Title**: text" on one
 * line, sub-points underneath. Two columns beyond four points.
 */
export type ListSlide = {
  layout: "list";
  title: string;
  lead: Lead;
  points: Point[];
};

export const list = defineLayout<ListSlide>({
  chrome: true,
  steps: (slide) => Math.min(slide.points.length, 8),
  Component: ({ slide, step }) => <List slide={slide} step={step} />,
});

function List({ slide, step }: { slide: ListSlide; step: number }) {
  const still = useStill();
  const points = slide.points.slice(0, 8).map(asPoint);
  const twoColumns = points.length > 4;
  return (
    <Page className={cn(CONTENT, "flex flex-col")}>
      <LeadBand lead={slide.lead} />
      <motion.ol
        variants={container}
        className={cn(
          "mt-[2.8cqw] grid min-h-0 flex-1 grid-flow-col gap-x-[3.6cqw]",
          twoColumns ? "grid-cols-2" : "grid-cols-1",
        )}
        style={{
          gridTemplateRows: `repeat(${twoColumns ? Math.ceil(points.length / 2) : points.length}, minmax(0, 1fr))`,
        }}
      >
        {points.map((point, i) => (
          <motion.li
            key={i}
            {...revealed(i, step, still)}
            className="flex items-center gap-[1.6cqw] border-foreground/8 border-b py-[0.8cqw]"
          >
            <Num n={i + 1} filled className="size-[2.6cqw] text-[1.05cqw]" />
            <div className="min-w-0">
              <p
                className={cn(
                  "leading-snug",
                  twoColumns ? "text-[1.08cqw]" : "text-[1.25cqw]",
                )}
              >
                <span className="font-semibold">
                  <Rich text={point.title} />
                </span>
                {point.text && (
                  <span className="text-foreground/75">
                    {" : "}
                    <Rich text={point.text} />
                  </span>
                )}
              </p>
              {!!point.items?.length && (
                <ul className="mt-[0.4cqw] space-y-[0.2cqw]">
                  {point.items.map((entry) => (
                    <li
                      key={entry}
                      className={cn(
                        "flex items-start gap-[0.8cqw] text-foreground/70",
                        twoColumns ? "text-[0.95cqw]" : "text-[1.05cqw]",
                      )}
                    >
                      <span className="mt-[0.6cqw] size-[0.35cqw] shrink-0 rounded-full bg-[var(--tone)]" />
                      <Rich text={entry} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.li>
        ))}
      </motion.ol>
    </Page>
  );
}

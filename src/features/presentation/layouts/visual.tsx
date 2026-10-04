import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import type { Crop, Point } from "@/presentations/types";
import { BrandMark } from "../monogram";
import {
  asPoint,
  BAND_TOP,
  container,
  type Lead,
  LeadBand,
  Num,
  Page,
  PointBody,
  revealed,
  UNDER_BAND,
  useStill,
} from "../ui";
import { defineLayout } from "./define";

/**
 * Part of the report on the right (whole page when `crop` is omitted), its explanation on the left.
 * The report itself is drawn by the player's persistent ReportStage (one iframe for all slides).
 */
export type VisualSlide = {
  layout: "visual";
  title: string;
  /** Key sentence, in the lead band above the panel and the report. */
  lead: Lead;
  points?: Point[];
  /** Zone of the report page, in page px (crop tool: key C). Omitted = whole page. */
  crop?: Crop;
  /** Another report url for this slide, e.g. with "&pageName=…" (defaults to the presentation's reportUrl). */
  report?: string;
};

/** Explanation panel shared by the visual and compare layouts. */
export function ExplanationPanel({
  lead,
  points = [],
  step = Infinity,
}: {
  lead: Lead;
  points?: Point[];
  /** Points revealed so far (all by default). */
  step?: number;
}) {
  const still = useStill();
  return (
    <Page className="absolute inset-0">
      <LeadBand
        lead={lead}
        className={cn("absolute right-[4cqw] left-[4cqw]", BAND_TOP)}
      />
      <motion.div
        variants={container}
        className={cn(
          "absolute bottom-[3.6cqw] left-[4cqw] flex w-[27cqw] flex-col bg-background/60 px-[1.8cqw] py-[1.6cqw]",
          UNDER_BAND,
        )}
      >
        <motion.ol
          variants={container}
          className="flex flex-1 flex-col gap-[1.3cqw]"
        >
          {points.map(asPoint).map((point, i) => (
            <motion.li
              key={i}
              {...revealed(i, step, still)}
              className="flex items-start gap-[1cqw]"
            >
              <Num n={i + 1} className="size-[1.7cqw] text-[0.75cqw]" />
              <PointBody point={point} size="sm" />
            </motion.li>
          ))}
        </motion.ol>
        <BrandMark
          className="absolute bottom-[1.6cqw] left-[1.8cqw] w-[2.4cqw]"
          delay={1}
        />
      </motion.div>
    </Page>
  );
}

export const visual = defineLayout<VisualSlide>({
  chrome: true,
  steps: (slide) => slide.points?.length ?? 0,
  Component: ({ slide, step }) => (
    <ExplanationPanel lead={slide.lead} points={slide.points} step={step} />
  ),
});

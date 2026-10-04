import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import {
  CONTENT,
  container,
  type Lead,
  LeadBand,
  Page,
  revealed,
  useStill,
} from "../ui";
import { defineLayout } from "./define";

/** Editorial 3×2 grid (e.g. the key KPIs): one word in large type and one sentence per tile, centered. */
export type CardsSlide = {
  layout: "cards";
  title: string;
  lead: Lead;
  items: { title: string; text?: string }[];
};

export const cards = defineLayout<CardsSlide>({
  chrome: true,
  steps: (slide) => slide.items.length,
  Component: ({ slide, step }) => <Cards slide={slide} step={step} />,
});

function Cards({ slide, step }: { slide: CardsSlide; step: number }) {
  const still = useStill();
  return (
    <Page className={cn(CONTENT, "flex flex-col")}>
      <LeadBand lead={slide.lead} />
      <motion.div
        variants={container}
        className="mt-[2.8cqw] grid min-h-0 flex-1 auto-rows-fr grid-cols-3 gap-[1.6cqw]"
      >
        {slide.items.map((tile, i) => (
          <motion.div
            key={tile.title}
            {...revealed(i, step, still)}
            className="group relative flex flex-col items-center justify-center overflow-hidden bg-background px-[2cqw] py-[1.8cqw] text-center transition-colors duration-700 hover:bg-[var(--tone)]/12"
          >
            <span className="font-title text-[3.2cqw] leading-none">
              {tile.title}
            </span>
            {tile.text && (
              <span className="mt-[1cqw] max-w-[20cqw] text-[1.05cqw] text-muted-foreground leading-snug">
                {tile.text}
              </span>
            )}
            <span className="absolute top-0 left-1/2 h-[0.15cqw] w-[3cqw] -translate-x-1/2 bg-[var(--tone)] transition-all duration-700 group-hover:w-full" />
          </motion.div>
        ))}
      </motion.div>
    </Page>
  );
}

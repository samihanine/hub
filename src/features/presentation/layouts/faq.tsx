import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import {
  CONTENT,
  container,
  type Lead,
  LeadBand,
  Page,
  Rich,
  revealed,
  useStill,
} from "../ui";
import { defineLayout } from "./define";

/** Questions & answers on two columns. */
export type FaqSlide = {
  layout: "faq";
  title: string;
  lead: Lead;
  items: { q: string; a: string }[];
};

export const faq = defineLayout<FaqSlide>({
  chrome: true,
  steps: (slide) => slide.items.length,
  Component: ({ slide, step }) => <Faq slide={slide} step={step} />,
});

function Faq({ slide, step }: { slide: FaqSlide; step: number }) {
  const still = useStill();
  return (
    <Page className={cn(CONTENT, "flex flex-col")}>
      <LeadBand lead={slide.lead} />
      <motion.dl
        variants={container}
        className="mt-[2.8cqw] grid min-h-0 flex-1 auto-rows-fr grid-cols-2 gap-x-[4cqw] gap-y-[1cqw]"
      >
        {slide.items.map(({ q, a }, i) => (
          <motion.div
            key={q}
            {...revealed(i, step, still)}
            className="border-foreground/10 border-t pt-[1.3cqw]"
          >
            <dt className="flex items-start gap-[1cqw] font-semibold text-[1.3cqw] leading-snug">
              <span className="font-normal font-title text-[1.6cqw] text-[var(--tone)] leading-none">
                ?
              </span>
              {q}
            </dt>
            <dd className="mt-[0.6cqw] pl-[1.8cqw] text-[1.12cqw] text-muted-foreground leading-relaxed">
              <Rich text={a} />
            </dd>
          </motion.div>
        ))}
      </motion.dl>
    </Page>
  );
}

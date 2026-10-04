import { motion } from "motion/react";
import { BrandMark } from "../monogram";
import { Eyebrow, ease, item, Page, Rule } from "../ui";
import { defineLayout } from "./define";

/** A sentence centered on the page, with a small rose blooming above it. */
export type QuoteSlide = {
  layout: "quote";
  title: string;
  text: string;
  author?: string;
};

export const quote = defineLayout<QuoteSlide>({
  chrome: false,
  Component: ({ slide }) => (
    <Page className="relative flex size-full flex-col items-center justify-center bg-white px-[16cqw] text-center">
      <BrandMark className="w-[4.4cqw]" delay={0.2} />
      <Eyebrow className="mt-[1.4cqw]">{slide.title}</Eyebrow>
      <motion.blockquote
        className="mt-[2.4cqw] text-balance font-title text-[3.2cqw] leading-[1.22]"
        variants={{
          hidden: { opacity: 0, y: 16, filter: "blur(6px)" },
          show: {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            transition: { duration: 1.6, ease, delay: 0.8 },
          },
        }}
      >
        <span className="text-[var(--tone)]">“</span>
        {slide.text}
        <span className="text-[var(--tone)]">”</span>
      </motion.blockquote>
      <Rule className="mx-auto mt-[3cqw] origin-center" />
      {slide.author && (
        <motion.p
          variants={item}
          className="mt-[1.6cqw] text-[0.8cqw] text-muted-foreground uppercase tracking-[0.32em]"
        >
          {slide.author}
        </motion.p>
      )}
    </Page>
  ),
});

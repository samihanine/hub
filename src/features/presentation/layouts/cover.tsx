import { ArrowRightIcon, RotateCcwIcon } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { BrandMark } from "../monogram";
import { ToileFlowers } from "../toile";
import { Eyebrow, ease, item, Page, RevealTitle, Rule } from "../ui";
import { defineLayout } from "./define";

/** Cover (first slide, or a closing "Questions ?" page): white page, toile de Jouy flowers around the title. */
export type CoverSlide = {
  layout: "cover";
  title: string;
  subtitle?: string;
  /** Small capitals above the title. */
  eyebrow?: string;
};

export const cover = defineLayout<CoverSlide>({
  chrome: false,
  Component: ({ slide, deck, index, go }) => {
    const { presentation } = deck;
    const first = index === 0;
    const last = index === deck.entries.length - 1;
    return (
      <Page
        className="relative size-full overflow-hidden bg-white"
        style={{ "--tone": "var(--toile)" } as React.CSSProperties}
      >
        <ToileFlowers className="pointer-events-none absolute inset-0 size-full" />

        {/* fine double frame, its hairlines drawn from the corners */}
        {[
          ["inset-[2.2cqw]", 0.55],
          ["inset-[2.65cqw]", 0.25],
        ].map(([inset, opacity], i) => (
          <motion.div
            key={i}
            className={cn("pointer-events-none absolute", inset as string)}
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: opacity as number,
                transition: { duration: 1.2, delay: 0.3 + i * 0.3 },
              },
            }}
          >
            {(
              [
                "top-0 inset-x-0 h-px origin-left",
                "bottom-0 inset-x-0 h-px origin-right",
              ] as const
            ).map((line) => (
              <motion.span
                key={line}
                className={cn("absolute bg-[var(--toile)]", line)}
                variants={{
                  hidden: { scaleX: 0 },
                  show: {
                    scaleX: 1,
                    transition: { duration: 2.4, ease, delay: 0.4 + i * 0.3 },
                  },
                }}
              />
            ))}
            {(
              [
                "left-0 inset-y-0 w-px origin-bottom",
                "right-0 inset-y-0 w-px origin-top",
              ] as const
            ).map((line) => (
              <motion.span
                key={line}
                className={cn("absolute bg-[var(--toile)]", line)}
                variants={{
                  hidden: { scaleY: 0 },
                  show: {
                    scaleY: 1,
                    transition: { duration: 2.4, ease, delay: 0.4 + i * 0.3 },
                  },
                }}
              />
            ))}
          </motion.div>
        ))}

        <motion.div
          variants={item}
          className="absolute top-[4.6cqw] left-[5.4cqw] text-[1cqw]"
        >
          <BrandMark full className="block w-[5.6cqw]" />
        </motion.div>
        {presentation.context && (
          <motion.p
            variants={item}
            className="absolute top-[5cqw] right-[5.4cqw] text-[0.8cqw] text-muted-foreground uppercase tracking-[0.34em]"
          >
            {presentation.context}
          </motion.p>
        )}

        <div className="absolute top-[49%] left-1/2 flex w-[52cqw] -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center">
          <Eyebrow>
            {slide.eyebrow ?? (first ? "User guide" : presentation.title)}
          </Eyebrow>
          <Rule className="mt-[1.2cqw] origin-center" />
          <RevealTitle
            text={slide.title}
            className="mt-[2cqw] text-[5.2cqw] text-foreground leading-[1.02]"
            delay={0.5}
          />
          {slide.subtitle && (
            <motion.p
              variants={item}
              className="mt-[2cqw] max-w-[38cqw] text-[1.5cqw] text-foreground/70 italic leading-snug"
            >
              {slide.subtitle}
            </motion.p>
          )}
        </div>

        <motion.div
          variants={item}
          className="absolute right-[5.4cqw] bottom-[4.4cqw] left-[5.4cqw] flex items-center justify-between text-[0.78cqw] text-muted-foreground uppercase tracking-[0.3em]"
        >
          <span>
            {[presentation.author, presentation.date]
              .filter(Boolean)
              .join("  —  ")}
          </span>
          {first && (
            <button
              type="button"
              onClick={() => go(1)}
              className="flex items-center gap-[0.8cqw] text-foreground uppercase transition-colors hover:text-[var(--toile)]"
            >
              Start{" "}
              <ArrowRightIcon className="size-[1cqw]" strokeWidth={1.25} />
            </button>
          )}
          {last && !first && (
            <button
              type="button"
              onClick={() => go(0)}
              className="flex items-center gap-[0.8cqw] text-foreground uppercase transition-colors hover:text-[var(--toile)]"
            >
              <RotateCcwIcon className="size-[0.9cqw]" strokeWidth={1.25} />{" "}
              Restart
            </button>
          )}
        </motion.div>
      </Page>
    );
  },
});

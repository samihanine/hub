import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { ToileSpray } from "../toile";
import {
  Eyebrow,
  ease,
  item,
  Markdown,
  Page,
  pad,
  RevealTitle,
  Rule,
  useStill,
} from "../ui";
import { defineLayout } from "./define";

/** Subsection divider (optional level): title, a short description, the trail of the section and a rose growing from it. */
export type SubsectionSlide = {
  layout: "subsection";
  title: string;
  /** Short markdown text under the title (**bold**, ==gold==, "- " lists…). */
  description?: string;
};

export const subsection = defineLayout<SubsectionSlide>({
  chrome: false,
  Component: ({ slide, deck, index }) => {
    const entry = deck.entries[index];
    const parent = deck.sections[entry.section];
    return (
      <Page
        className="relative size-full overflow-hidden bg-white"
        style={{ "--tone": "var(--toile)" } as React.CSSProperties}
      >
        {/* full-slide box: the stem starts where the trail ends (TRAIL_END ↔ Trail position) */}
        <ToileSpray className="pointer-events-none absolute inset-0 size-full" />

        {/* title block, vertically centred above the trail, aligned with its first medallion (8 + 6 - 1.4cqw) */}
        <div className="absolute top-[3cqw] bottom-[14cqw] left-[12.6cqw] flex w-[48cqw] flex-col justify-center">
          {parent && <Eyebrow>{parent.title}</Eyebrow>}
          <Rule className="mt-[1.2cqw]" />
          <RevealTitle
            text={slide.title}
            className="mt-[2cqw] text-[4.6cqw] text-foreground leading-[1.04]"
            delay={0.3}
          />
          {slide.description && (
            <motion.div variants={item} className="mt-[2cqw] max-w-[44cqw]">
              <Markdown
                text={slide.description}
                className="text-[1.3cqw] text-foreground/75 leading-[1.6]"
              />
            </motion.div>
          )}
        </div>

        {parent && (
          <Trail
            steps={parent.subsections.map((step) => step.title)}
            current={entry.subsection}
          />
        )}
      </Page>
    );
  },
});

/**
 * Trail of the section: numbered medallions on one continuous ink line. Its right end (58cqw, 49.35cqw)
 * is where the stem of the rose starts (TRAIL_END in toile.tsx): keep both in sync.
 * The current step: a drop of ink runs to it, then its medallion grows, fills and keeps a slow halo;
 * steps done are tinted, steps ahead stay white.
 */
function Trail({ steps, current }: { steps: string[]; current: number }) {
  const still = useStill();
  const at = (i: number) =>
    steps.length > 1 ? (i / (steps.length - 1)) * 100 : 100;
  const from = Math.max(current - 1, 0);
  const arrive = 0.6 + 1.4;
  return (
    <motion.div
      variants={item}
      className="absolute bottom-[5.5cqw] left-[8cqw] w-[56cqw]"
    >
      <div className="relative mx-[6cqw] mt-[2.4cqw] h-[2.8cqw]">
        {/* one continuous ink line, like the stem it grows into; a drop of ink runs to the current step */}
        <span className="absolute inset-x-0 top-1/2 h-[0.18cqw] -translate-y-1/2 bg-[var(--toile)]" />
        {current > 0 && !still && (
          <motion.span
            className="absolute top-1/2 size-[0.9cqw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--toile)] ring-[0.3cqw] ring-white"
            initial={{ left: `${at(from)}%`, opacity: 0 }}
            animate={{ left: `${at(current)}%`, opacity: [0, 1, 1, 0] }}
            transition={{
              duration: 1.4,
              ease,
              delay: 0.6,
              opacity: { duration: 1.4, delay: 0.6, times: [0, 0.15, 0.85, 1] },
            }}
          />
        )}

        {steps.map((step, i) => {
          const done = i < current;
          const here = i === current;
          return (
            <div
              key={step}
              className="absolute top-0 -translate-x-1/2"
              style={{ left: `${at(i)}%` }}
            >
              <motion.div
                className="relative size-[2.8cqw]"
                initial={false}
                animate={{ scale: here ? 1.3 : 1 }}
                transition={{
                  duration: 0.9,
                  ease,
                  delay: here ? arrive - 0.2 : 0,
                }}
              >
                {here && (
                  <motion.span
                    className="absolute inset-0 rounded-full border border-[var(--toile)]"
                    initial={{ scale: 1, opacity: 0 }}
                    animate={{ scale: [1, 1.9], opacity: [0.55, 0] }}
                    transition={{
                      duration: 2.6,
                      ease: "easeOut",
                      repeat: Infinity,
                      repeatDelay: 0.6,
                      delay: arrive,
                    }}
                  />
                )}
                <motion.span
                  className={cn(
                    "absolute inset-0 grid place-items-center rounded-full border font-title text-[1.05cqw]",
                    done &&
                      "border-[var(--toile)] bg-[color-mix(in_oklab,var(--toile)_10%,white)] text-[var(--toile)]",
                    !done &&
                      !here &&
                      "border-[var(--toile)]/35 bg-white text-muted-foreground",
                  )}
                  initial={
                    here && !still
                      ? {
                          backgroundColor: "#ffffff",
                          color: "var(--toile)",
                          borderColor: "var(--toile)",
                          scale: 0.8,
                        }
                      : false
                  }
                  animate={
                    here
                      ? {
                          backgroundColor: "var(--toile)",
                          color: "#ffffff",
                          borderColor: "var(--toile)",
                          scale: 1,
                        }
                      : undefined
                  }
                  transition={{ duration: 0.8, ease, delay: arrive - 0.2 }}
                >
                  {pad(i + 1)}
                </motion.span>
              </motion.div>
              <span
                className={cn(
                  "absolute top-[4.2cqw] left-1/2 w-[13cqw] -translate-x-1/2 text-center text-[0.78cqw] uppercase leading-snug tracking-[0.2em] transition-colors duration-700",
                  here
                    ? "font-semibold text-foreground"
                    : done
                      ? "text-[var(--toile)]/70"
                      : "text-muted-foreground/70",
                )}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

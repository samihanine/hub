import { motion } from "motion/react";
import type { Deck } from "../deck";
import { BrandMark } from "../monogram";
import {
  Eyebrow,
  ease,
  item,
  Page,
  pad,
  RevealTitle,
  Rule,
  revealed,
  useStill,
} from "../ui";
import { defineLayout } from "./define";

/** Table of contents, built automatically from the section and subsection slides. */
export type PlanSlide = { layout: "plan"; title: string };

export const plan = defineLayout<PlanSlide>({
  chrome: false,
  steps: (_, deck) => deck.sections.length,
  Component: (props) => <Plan {...props} />,
});

function Plan({
  slide,
  deck,
  go,
  step,
}: {
  slide: PlanSlide;
  deck: Deck;
  go: (index: number) => void;
  step: number;
}) {
  const still = useStill();
  return (
    <Page className="relative grid size-full grid-cols-[34fr_66fr] bg-white">
      <div className="relative flex flex-col justify-center pr-[3cqw] pl-[6cqw]">
        <div className="absolute top-[6.5cqw] left-[6cqw]">
          <Eyebrow>{deck.presentation.title}</Eyebrow>
          <Rule className="mt-[1.2cqw]" />
        </div>
        <RevealTitle
          text={slide.title}
          className="text-[4.4cqw] leading-none"
          delay={0.2}
        />
        <Rule className="mt-[2.4cqw] w-[4cqw]" />
        <motion.p
          variants={item}
          className="mt-[2cqw] text-[1.05cqw] text-muted-foreground"
        >
          {deck.sections.length} parts · {deck.entries.length} pages
        </motion.p>
        <BrandMark
          className="absolute bottom-[4cqw] left-[6cqw] w-[5cqw]"
          delay={0.6}
        />
      </div>

      <div className="flex min-h-0 flex-col border-foreground/10 border-l py-[5cqw] pr-[6cqw] pl-[4cqw]">
        <motion.ol
          className="flex flex-1 flex-col justify-center gap-[0.4cqw]"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.12, delayChildren: 0.4 } },
          }}
        >
          {deck.sections.map((section, s) => (
            <motion.li
              key={section.slide}
              {...revealed(s, step, still)}
              className="group"
            >
              <button
                type="button"
                onClick={() => go(section.slide)}
                className="flex w-full items-baseline gap-[2cqw] py-[0.9cqw] text-left"
              >
                <span className="w-[3cqw] shrink-0 font-title text-[1.5cqw] text-[var(--tone)] tabular-nums">
                  {pad(s + 1)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-title text-[2cqw] leading-tight transition-colors duration-500 group-hover:text-[var(--tone)]">
                    {section.title}
                  </span>
                  {section.subsections.length > 0 && (
                    <span className="mt-[0.5cqw] flex flex-wrap gap-x-[1.6cqw] gap-y-[0.3cqw] text-[0.78cqw] text-muted-foreground uppercase tracking-[0.22em]">
                      {section.subsections.map((sub) => (
                        <span key={sub.slide}>{sub.title}</span>
                      ))}
                    </span>
                  )}
                  <motion.span
                    className="mt-[0.9cqw] block h-px origin-left bg-foreground/10"
                    variants={{
                      hidden: { scaleX: 0 },
                      show: { scaleX: 1, transition: { duration: 1.2, ease } },
                    }}
                  />
                </span>
              </button>
            </motion.li>
          ))}
        </motion.ol>
      </div>
    </Page>
  );
}

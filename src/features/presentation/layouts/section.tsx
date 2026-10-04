import {
  animate,
  type MotionValue,
  motion,
  useMotionValue,
  useTransform,
} from "motion/react";
import { useEffect } from "react";
import { BrandMark } from "../monogram";
import { Eyebrow, ease, Page, pad, picture, Rule, useStill } from "../ui";
import { defineLayout } from "./define";

/**
 * Section divider: the section titles on a wheel (current one in the middle, previous and next
 * ones lighter, numbered) that rolls onto the current section, picture on the right half.
 * Starts a new part of the outline.
 */
export type SectionSlide = { layout: "section"; title: string; image?: string };

export const section = defineLayout<SectionSlide>({
  chrome: false,
  Component: ({ slide, deck, index }) => {
    const number = deck.entries[index].section + 1;
    return (
      <Page className="grid size-full grid-cols-[44fr_56fr] bg-white">
        <div className="relative flex flex-col justify-center pr-[4cqw] pl-[6cqw]">
          <div className="absolute top-[6.5cqw] left-[6cqw]">
            <Eyebrow>
              {pad(number)} — {deck.presentation.title}
            </Eyebrow>
            <Rule className="mt-[1.2cqw]" />
          </div>
          <SectionWheel
            // 00 = the cover, so the first section also has a title above it
            titles={["Presentation", ...deck.sections.map((s) => s.title)]}
            current={deck.entries[index].section + 1}
          />
          <BrandMark
            className="absolute bottom-[4cqw] left-[6cqw] w-[3.6cqw]"
            delay={1}
          />
        </div>
        <motion.div
          variants={{
            hidden: { clipPath: "inset(0 0 0 100%)" },
            show: {
              clipPath: "inset(0 0 0 0%)",
              transition: { duration: 1.6, ease },
            },
          }}
          className="overflow-hidden"
        >
          {slide.image ? (
            <motion.img
              src={picture(slide.image)}
              alt=""
              className="size-full object-cover"
              variants={{
                hidden: { scale: 1.12 },
                show: { scale: 1, transition: { duration: 2.6, ease } },
              }}
            />
          ) : (
            <div className="cannage size-full" />
          )}
        </motion.div>
      </Page>
    );
  },
});

/** Distance between the current title and its neighbours on the wheel. */
const STEP = 6.6;

/** Drum of the numbered section titles: rolls from the previous section to the current one. */
function SectionWheel({
  titles,
  current,
}: {
  titles: string[];
  current: number;
}) {
  const still = useStill();
  const position = useMotionValue(still ? current : current - 1);
  useEffect(() => {
    if (still) return;
    const controls = animate(position, current, {
      duration: 1.9,
      ease,
      delay: 0.35,
    });
    return () => controls.stop();
  }, [position, current, still]);

  return (
    <div className="relative h-[36cqw] [mask-image:linear-gradient(to_bottom,transparent,black_12%,black_88%,transparent)] [perspective:60cqw]">
      {/* selection window */}
      <span className="absolute top-1/2 left-0 h-px w-[4cqw] -translate-y-[3.4cqw] bg-[var(--tone)]/60" />
      <span className="absolute top-1/2 left-0 h-px w-[4cqw] translate-y-[3.4cqw] bg-[var(--tone)]/60" />
      {titles.map((title, i) => (
        <WheelRow key={i} index={i} title={title} position={position} />
      ))}
    </div>
  );
}

function WheelRow({
  index,
  title,
  position,
}: {
  index: number;
  title: string;
  position: MotionValue<number>;
}) {
  const distance = useTransform(position, (p) => index - p);
  // Two titles visible on each side of the current one, smaller, lighter and closer together.
  const y = useTransform(distance, (d) => {
    const a = Math.abs(d);
    return `${Math.sign(d) * (a <= 1 ? a * STEP : STEP + (a - 1) * STEP * 0.72)}cqw`;
  });
  const rotateX = useTransform(distance, (d) => -d * 22);
  // Inactive titles stay faint: 0.28 next to the current one, 0.12 two steps away.
  const opacity = useTransform(distance, (d) => {
    const a = Math.abs(d);
    return a <= 1 ? 1 - a * 0.72 : Math.max(0, 0.28 - (a - 1) * 0.16);
  });
  const scale = useTransform(
    distance,
    (d) => 1 - Math.min(Math.abs(d), 2.5) * 0.2,
  );
  return (
    <motion.div
      style={{ y, rotateX, opacity, scale }}
      className="absolute top-1/2 left-0 origin-left"
    >
      <div className="flex -translate-y-1/2 items-baseline gap-[1.4cqw] whitespace-nowrap">
        <span className="font-title text-[1.4cqw] text-[var(--tone)] tabular-nums">
          {pad(index)}
        </span>
        <span className="font-title text-[4cqw] leading-none tracking-[-0.01em]">
          {title}
        </span>
      </div>
    </motion.div>
  );
}

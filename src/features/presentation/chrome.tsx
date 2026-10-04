import { AnimatePresence, motion } from "motion/react";
import type { Slide } from "@/presentations/types";
import { BrandMark } from "./monogram";
import { ease } from "./ui";

/** Header of content slides (logo, slide title) and page number. */
export function SlideChrome({
  slide,
  index,
  total,
}: {
  slide: Slide;
  index: number;
  total: number;
}) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <div className="absolute top-[2.6cqw] right-[4cqw] left-[4cqw] flex items-center gap-[2cqw]">
        <span className="text-[0.95cqw]">
          {/* keyed: the logo draws itself again on every page */}
          <BrandMark key={index} full className="block w-[5.6cqw]" />
        </span>
        <span className="h-px flex-1 bg-foreground/15" />
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.p
            key={index}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.6, ease }}
            className="pointer-events-auto whitespace-nowrap font-title text-[1.6cqw] leading-tight"
          >
            {slide.title}
          </motion.p>
        </AnimatePresence>
      </div>
      <PageNumber index={index} total={total} />
    </div>
  );
}

export function PageNumber({ index, total }: { index: number; total: number }) {
  return (
    <span className="pointer-events-none absolute right-[4cqw] bottom-[1.4cqw] z-20 font-title text-[0.8cqw] text-muted-foreground tabular-nums">
      {index + 1} <span className="text-[var(--tone)]">/</span> {total}
    </span>
  );
}

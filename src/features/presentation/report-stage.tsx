import { motion } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { type Crop, PAGE, type PageSize } from "@/presentations/types";
import { MockReport } from "./mock-report";

const ease = [0.22, 1, 0.36, 1] as const;

/** Where the report sits on a slide (same composition on every report slide), in stage cqw. */
/** Under the lead band (UNDER_BAND in ui.tsx), right of the explanation panel. */
/** Report layout: the whole page on the full width, under the lead band (scrollable). */
export const REPORT_FULL_BOX =
  "left-[4cqw] right-[4cqw] top-[14cqw] bottom-[3.6cqw]";
export const REPORT_BOX =
  "left-[33cqw] right-[4cqw] top-[14.8cqw] bottom-[3.6cqw]";

/**
 * One persistent report iframe for the whole presentation: loaded once, then "zoomed" on the crop of
 * each slide (no reload between slides of the same report page; a Power BI sign-in done in it stays valid).
 * The crop (page px, reference `page`) is fitted ("contain") and centered in the report box.
 * `scroll` (report layout): the whole page on the full width, scrollable — still the same iframe,
 * so no new sign-in.
 */
export function ReportStage({
  src,
  crop,
  scroll = false,
  page = PAGE,
}: {
  src?: string;
  /** Crop of the current slide; null = no report on this slide (hidden, but kept loaded). */
  crop: Crop | null;
  scroll?: boolean;
  page?: PageSize;
}) {
  const full: Crop = { x: 0, y: 0, w: page.w, h: page.h };
  const target = scroll ? full : crop;

  // Keep showing the last crop while the layer fades out, and swap geometry while hidden.
  const [shown, setShown] = useState<Crop>(target ?? full);
  const [hidden, setHidden] = useState(false);
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs when the crop values change, not on every new object
  useEffect(() => {
    if (!target || sameCrop(target, shown)) return;
    setHidden(true);
    const timer = setTimeout(() => {
      setShown(target);
      setHidden(false);
    }, 320);
    return () => clearTimeout(timer);
  }, [target?.x, target?.y, target?.w, target?.h]);

  const box = useRef<HTMLDivElement>(null);
  const size = useSize(box);
  const ratio = shown.w / shown.h;
  // scroll: full width, at the page's own ratio (taller than the box); otherwise "contain"
  const dw = scroll ? size.w : Math.min(size.w, size.h * ratio);
  const dh = dw / ratio;
  const k = dw / shown.w; // css px per page px

  const visible = !!crop || scroll;
  useEffect(() => {
    if (scroll && box.current) box.current.scrollTop = 0;
  }, [scroll]);

  return (
    <motion.div
      ref={box}
      initial={false}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.6, ease }}
      // scroll mode: the box itself is what is seen (and captured for the PowerPoint)
      data-capture={scroll ? "report" : undefined}
      className={cn(
        "absolute z-10",
        scroll
          ? cn(
              REPORT_FULL_BOX,
              "overflow-y-auto overflow-x-hidden overscroll-contain",
            )
          : REPORT_BOX,
        !visible && "pointer-events-none",
      )}
    >
      {size.w > 0 && (
        <motion.div
          data-capture={scroll ? undefined : "report"}
          className="absolute overflow-hidden bg-white shadow-[0_0_0_1px_rgb(38_34_29/0.08),0_1.6cqw_3.6cqw_-2cqw_rgb(60_45_20/0.3)]"
          initial={false}
          animate={{
            width: dw,
            height: dh,
            left: scroll ? 0 : (size.w - dw) / 2,
            top: scroll ? 0 : (size.h - dh) / 2,
          }}
          transition={{ duration: 0.8, ease }}
        >
          <motion.div
            className="absolute"
            style={{
              width: page.w * k,
              height: page.h * k,
              left: -shown.x * k,
              top: -shown.y * k,
            }}
            animate={{ opacity: hidden ? 0 : 1 }}
            transition={{
              duration: hidden ? 0.3 : 0.7,
              delay: hidden ? 0 : 0.15,
            }}
          >
            {src ? (
              <iframe
                src={src}
                title="Power BI report"
                allowFullScreen
                scrolling="no"
                className="block size-full overflow-hidden border-0"
              />
            ) : (
              <MockReport
                style={{ display: "block", width: "100%", height: "100%" }}
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}

const sameCrop = (a: Crop, b: Crop) =>
  a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h;

function useSize(ref: React.RefObject<HTMLElement | null>) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setSize({ w: entry.contentRect.width, h: entry.contentRect.height }),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return size;
}

import { ChevronsLeftRightIcon } from "lucide-react";
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
} from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  type CompareSide,
  type Crop,
  PAGE,
  type PageSize,
} from "@/presentations/types";
import { MockReport } from "./mock-report";
import { REPORT_BOX } from "./report-stage";

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * Before / after in the report frame: both report pages are stacked, the "after" one is revealed
 * on the right of a draggable vertical slider (drag the knob, or click anywhere on the bar).
 */
export function CompareStage({
  before,
  after,
  reportUrl,
  page = PAGE,
  still = false,
}: {
  before: CompareSide;
  after: CompareSide;
  reportUrl?: string;
  page?: PageSize;
  /** Drawn directly with the slider in the middle (PDF export). */
  still?: boolean;
}) {
  const full: Crop = { x: 0, y: 0, w: page.w, h: page.h };
  const box = useRef<HTMLDivElement>(null);
  const size = useSize(box);
  // The frame takes the whole report area; each side shows its zone widened to the frame's shape.
  const dw = size.w;
  const dh = size.h;
  const aspect = dh ? dw / dh : 16 / 9;
  const beforeRegion = widen(before.crop ?? full, aspect, page);
  const afterRegion = widen(after.crop ?? full, aspect, page);

  // Slider position in %, animated in on mount (reveals the "after" page).
  const position = useMotionValue(still ? 50 : 100);
  const clip = useTransform(position, (p) => `inset(0 0 0 ${p}%)`);
  const left = useTransform(position, (p) => `${p}%`);
  const [dragging, setDragging] = useState(false);
  const [value, setValue] = useState(100);
  useMotionValueEvent(position, "change", (p) => setValue(Math.round(p)));
  useEffect(() => {
    if (still) return;
    const controls = animate(position, 50, { duration: 1.6, ease, delay: 0.8 });
    return () => controls.stop();
  }, [position, still]);

  const frame = useRef<HTMLDivElement>(null);
  const moveTo = (clientX: number) => {
    const rect = frame.current!.getBoundingClientRect();
    position.set(
      Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100)),
    );
  };

  return (
    <motion.div
      ref={box}
      initial={still ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease, delay: 0.2 }}
      className={cn("absolute z-10", REPORT_BOX)}
    >
      {size.w > 0 && (
        <div
          ref={frame}
          data-capture="report"
          className="absolute overflow-hidden bg-white shadow-[0_0_0_1px_rgb(38_34_29/0.08),0_1.6cqw_3.6cqw_-2cqw_rgb(60_45_20/0.3)]"
          style={{ width: dw, height: dh }}
        >
          <Layer
            src={before.report ?? reportUrl}
            crop={beforeRegion}
            width={dw}
            height={dh}
            page={page}
          />
          <motion.div className="absolute inset-0" style={{ clipPath: clip }}>
            <Layer
              src={after.report ?? reportUrl}
              crop={afterRegion}
              width={dw}
              height={dh}
              page={page}
            />
          </motion.div>

          {/* While dragging, a transparent layer keeps the iframes from swallowing the pointer. */}
          {dragging && (
            <div className="absolute inset-0 z-20 cursor-ew-resize" />
          )}

          <Label
            text={before.label ?? "Before"}
            className="left-[1cqw]"
            visible={value > 12}
          />
          <Label
            text={after.label ?? "After"}
            className="right-[1cqw]"
            visible={value < 88}
          />

          {/* Slider: hairline + knob */}
          <motion.div
            className="absolute inset-y-0 z-30 w-[2cqw] -translate-x-1/2 cursor-ew-resize touch-none"
            style={{ left }}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              setDragging(true);
              moveTo(e.clientX);
            }}
            onPointerMove={(e) => dragging && moveTo(e.clientX)}
            onPointerUp={() => setDragging(false)}
            role="slider"
            aria-label="Before / after"
            aria-valuenow={value}
            aria-valuemin={0}
            aria-valuemax={100}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                e.stopPropagation();
                e.preventDefault();
                position.set(
                  Math.min(
                    100,
                    Math.max(
                      0,
                      position.get() + (e.key === "ArrowLeft" ? -5 : 5),
                    ),
                  ),
                );
              }
            }}
          >
            <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white shadow-[0_0_0_1px_rgb(176_141_87/0.7)]" />
            <span
              className={cn(
                "absolute top-1/2 left-1/2 grid size-[2.6cqw] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[var(--tone)] text-white shadow-[0_0.4cqw_1.2cqw_rgb(0_0_0/0.25)] ring-[0.25cqw] ring-white transition-transform duration-300",
                dragging && "scale-110",
              )}
            >
              <ChevronsLeftRightIcon
                className="size-[1.3cqw]"
                strokeWidth={1.5}
              />
            </span>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

/**
 * Grows a zone around its centre to the frame's aspect ratio (within the page), so a narrow
 * visual is shown with its surroundings instead of leaving white bands.
 */
function widen(crop: Crop, aspect: number, page: PageSize): Crop {
  const w = Math.min(page.w, Math.max(crop.w, crop.h * aspect));
  const h = Math.min(page.h, Math.max(crop.h, w / aspect));
  const clamp = (v: number, max: number) => Math.min(Math.max(v, 0), max);
  return {
    x: clamp(crop.x + crop.w / 2 - w / 2, page.w - w),
    y: clamp(crop.y + crop.h / 2 - h / 2, page.h - h),
    w,
    h,
  };
}

/** One report zone fitted (contain, centred) in the frame (crop in page px). */
function Layer({
  src,
  crop,
  width,
  height,
  page,
}: {
  src?: string;
  crop: Crop;
  width: number;
  height: number;
  page: PageSize;
}) {
  const k = Math.min(width / crop.w, height / crop.h);
  const offsetX = (width - crop.w * k) / 2;
  const offsetY = (height - crop.h * k) / 2;
  return (
    <div className="absolute inset-0 overflow-hidden bg-white">
      <div
        className="absolute"
        style={{
          width: page.w * k,
          height: page.h * k,
          left: offsetX - crop.x * k,
          top: offsetY - crop.y * k,
        }}
      >
        {src ? (
          <iframe
            src={src}
            title="Power BI report"
            scrolling="no"
            className="block size-full overflow-hidden border-0"
          />
        ) : (
          <MockReport
            style={{ display: "block", width: "100%", height: "100%" }}
          />
        )}
      </div>
    </div>
  );
}

function Label({
  text,
  className,
  visible,
}: {
  text: string;
  className?: string;
  visible: boolean;
}) {
  return (
    <span
      className={cn(
        "pointer-events-none absolute top-[1cqw] z-20 bg-white/92 px-[0.9cqw] py-[0.35cqw] text-[0.72cqw] text-foreground uppercase tracking-[0.26em] shadow-sm backdrop-blur transition-opacity duration-500",
        visible ? "opacity-100" : "opacity-0",
        className,
      )}
    >
      {text}
    </span>
  );
}

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

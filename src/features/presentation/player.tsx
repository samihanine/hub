import { useNavigate, useSearch } from "@tanstack/react-router";
import { MinimizeIcon, PanelLeftOpenIcon } from "lucide-react";
import { AnimatePresence, motion, type Variants } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLocalState } from "@/lib/use-local-state";
import { cn } from "@/lib/utils";
import { PAGE, type Presentation } from "@/presentations/types";
import { PageNumber, SlideChrome } from "./chrome";
import { CompareStage } from "./compare-stage";
import { CropPicker } from "./crop-picker";
import { buildDeck, GOLD } from "./deck";
import { layoutOf } from "./layouts";
import { ReportStage } from "./report-stage";
import { Sidebar } from "./sidebar";
import { ease } from "./ui";

/** Slow cross-fade with a slight drift in the reading direction. */
const slideVariants: Variants = {
  enter: (dir: number) => ({
    opacity: 0,
    x: `${dir * 2.5}%`,
    filter: "blur(6px)",
  }),
  center: {
    opacity: 1,
    x: "0%",
    filter: "blur(0px)",
    transition: { duration: 1, ease },
  },
  exit: (dir: number) => ({
    opacity: 0,
    x: `${dir * -1.5}%`,
    filter: "blur(6px)",
    transition: { duration: 0.55, ease },
  }),
};

export function Player({ presentation }: { presentation: Presentation }) {
  const deck = useMemo(() => buildDeck(presentation), [presentation]);
  const total = deck.entries.length;
  const { slide: page = 1 } = useSearch({ from: "/presentation" });
  const navigate = useNavigate({ from: "/presentation" });
  const index = Math.min(Math.max(page - 1, 0), total - 1);
  const slide = deck.entries[index].slide;
  const layout = layoutOf(slide);

  const direction = useRef(1);
  const [cropping, setCropping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useLocalState(
    "hub:presentation-sidebar",
    true,
  );
  const fullscreen = useFullscreen();

  // Items revealed so far on the current slide (layouts with `steps`); reset on every slide change,
  // except when coming back from the next slide (everything shown).
  const steps = layout.steps?.(slide, deck) ?? 0;
  const [reveal, setReveal] = useState({ index, step: 0 });
  const step = reveal.index === index ? Math.min(reveal.step, steps) : 0;

  const go = useCallback(
    (target: number, revealAll = false) => {
      const next = Math.min(Math.max(target, 0), total - 1);
      if (next === index) return;
      direction.current = next > index ? 1 : -1;
      setReveal({ index: next, step: revealAll ? Infinity : 0 });
      void navigate({
        search: (s) => ({ ...s, slide: next + 1 }),
        replace: true,
      });
    },
    [total, index, navigate],
  );
  /** Next item of the slide, then the next slide. */
  const forward = useCallback(() => {
    if (step < steps) setReveal({ index, step: step + 1 });
    else go(index + 1);
  }, [step, steps, index, go]);
  /** Previous item of the slide, then the previous slide (fully revealed). */
  const backward = useCallback(() => {
    if (step > 0) setReveal({ index, step: step - 1 });
    else go(index - 1, true);
  }, [step, index, go]);
  const jump = useCallback((target: number) => go(target), [go]);
  const back = useCallback(() => void navigate({ to: "/" }), [navigate]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (cropping || e.metaKey || e.ctrlKey || e.altKey) return;
      if (
        (e.target as HTMLElement).closest("input, textarea, [contenteditable]")
      )
        return;
      const actions: Record<string, () => void> = {
        ArrowRight: forward,
        ArrowDown: forward,
        PageDown: forward,
        " ": forward,
        Enter: forward,
        ArrowLeft: backward,
        ArrowUp: backward,
        PageUp: backward,
        Home: () => go(0),
        End: () => go(total - 1),
        f: () => fullscreen.toggle(),
        c: () => setCropping(true),
        s: () => setSidebarOpen((open) => !open),
        Escape: () => !document.fullscreenElement && back(),
      };
      const action = actions[e.key];
      if (action) {
        e.preventDefault();
        action();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    go,
    forward,
    backward,
    total,
    cropping,
    fullscreen,
    back,
    setSidebarOpen,
  ]);

  // Report of the slide: visual = its zone (or the whole page). The iframe keeps the last report
  // page shown, so the slides in between do not reload it.
  const size = presentation.page ?? PAGE;
  const crop =
    slide.layout === "visual"
      ? (slide.crop ?? { x: 0, y: 0, w: size.w, h: size.h })
      : undefined;
  const lastReport = useRef(presentation.reportUrl);
  if (slide.layout === "visual" || slide.layout === "report")
    lastReport.current = slide.report ?? presentation.reportUrl;
  const reportUrl = lastReport.current;

  const swipe = useRef<number | null>(null);

  return (
    <div
      className="flex h-dvh overflow-hidden bg-white"
      style={{ "--tone": GOLD } as React.CSSProperties}
    >
      {/* Collapsible side panel (CSS width transition; kept mounted to preserve its scroll). */}
      <div
        className={cn(
          "shrink-0 overflow-hidden transition-[width,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] max-md:hidden",
          !fullscreen.active && sidebarOpen
            ? "w-64 opacity-100"
            : "w-0 opacity-0",
        )}
        aria-hidden={!sidebarOpen}
      >
        <Sidebar
          deck={deck}
          index={index}
          onJump={jump}
          onNext={forward}
          onPrevious={backward}
          onPptx={() => {
            // the export runs from the print view, where every slide (and report) is drawn
            void navigate({ search: (s) => ({ ...s, print: true }) });
            toast.info("Click “PowerPoint” to export", {
              description:
                "Export the PDF first: the reports are taken from it.",
            });
          }}
          onPdf={() =>
            void navigate({ search: (s) => ({ ...s, print: true }) })
          }
          onBack={back}
          onFullscreen={fullscreen.toggle}
          onCrop={() => setCropping(true)}
          onCollapse={() => setSidebarOpen(false)}
        />
      </div>

      {/* Stage: 16:9, as large as possible */}
      <div className="relative grid min-w-0 flex-1 place-items-center [container-type:size]">
        <div
          className="relative aspect-video [container-type:inline-size]"
          style={{ width: "min(100cqw, calc(100cqh * 16 / 9))" }}
          onPointerDown={(e) =>
            (swipe.current = e.pointerType === "touch" ? e.clientX : null)
          }
          onPointerUp={(e) => {
            if (swipe.current === null) return;
            const delta = e.clientX - swipe.current;
            if (Math.abs(delta) > 60) (delta < 0 ? forward : backward)();
            swipe.current = null;
          }}
          // A click on the slide reveals the next item / goes to the next slide, unless it lands on
          // a control or ends a text selection.
          onClick={(e) => {
            if (
              (e.target as HTMLElement).closest(
                "button, a, input, iframe, [role=slider]",
              ) ||
              window.getSelection()?.toString()
            )
              return;
            forward();
          }}
        >
          <div className="absolute inset-0 overflow-hidden">
            <AnimatePresence initial={false} custom={direction.current}>
              <motion.div
                key={index}
                custom={direction.current}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="absolute inset-0"
              >
                <layout.Component
                  slide={slide}
                  deck={deck}
                  index={index}
                  go={jump}
                  step={step}
                />
              </motion.div>
            </AnimatePresence>
            {layout.chrome ? (
              <SlideChrome slide={slide} index={index} total={total} />
            ) : (
              <PageNumber index={index} total={total} />
            )}
            <ReportStage
              src={reportUrl}
              crop={crop ?? null}
              scroll={slide.layout === "report"}
              page={presentation.page}
            />
            {slide.layout === "compare" && (
              <CompareStage
                key={index}
                before={slide.before}
                after={slide.after}
                reportUrl={presentation.reportUrl}
                page={presentation.page}
              />
            )}
          </div>
        </div>

        {!fullscreen.active && !sidebarOpen && (
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => setSidebarOpen(true)}
                aria-label="Show outline (S)"
                className="absolute top-3 left-3 z-30 grid size-8 place-items-center rounded-full border bg-white/90 text-muted-foreground shadow-sm backdrop-blur transition-colors hover:border-gold hover:text-gold"
              >
                <PanelLeftOpenIcon className="size-4" strokeWidth={1.25} />
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="right">Show outline (S)</TooltipContent>
          </Tooltip>
        )}
        {fullscreen.active && (
          <button
            type="button"
            onClick={fullscreen.toggle}
            aria-label="Exit full screen"
            className="absolute top-4 right-4 text-muted-foreground/50 transition-colors hover:text-gold"
          >
            <MinimizeIcon className="size-4" strokeWidth={1.25} />
          </button>
        )}
      </div>

      <CropPicker
        key={index}
        open={cropping}
        onOpenChange={setCropping}
        src={reportUrl}
        page={presentation.page}
        initial={crop}
      />
    </div>
  );
}

function useFullscreen() {
  const [active, setActive] = useState(() => !!document.fullscreenElement);
  useEffect(() => {
    const onChange = () => setActive(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);
  const toggle = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else
      void document.documentElement
        .requestFullscreen?.()
        .catch(() => undefined);
  }, []);
  return useMemo(() => ({ active, toggle }), [active, toggle]);
}

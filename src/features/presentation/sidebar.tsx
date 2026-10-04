import {
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CropIcon,
  FileDownIcon,
  MaximizeIcon,
  PanelLeftCloseIcon,
  PresentationIcon,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Deck } from "./deck";
import { ease } from "./ui";

type Actions = {
  onJump: (i: number) => void;
  /** Next / previous item of the slide (step-by-step reveal), then slide. */
  onNext: () => void;
  onPrevious: () => void;
  onPdf: () => void;
  onPptx: () => void;
  onBack: () => void;
  onFullscreen: () => void;
  onCrop: () => void;
  onCollapse: () => void;
};

/** Side panel: back, outline of the presentation (from its section / subsection slides), previous / next. */
export function Sidebar({
  deck,
  index,
  onJump,
  onNext,
  onPrevious,
  onPdf,
  onPptx,
  onBack,
  onFullscreen,
  onCrop,
  onCollapse,
}: { deck: Deck; index: number } & Actions) {
  const currentRef = useRef<HTMLButtonElement>(null);
  // biome-ignore lint/correctness/useExhaustiveDependencies: scrolls the current row into view when the slide changes
  useEffect(() => {
    currentRef.current?.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  }, [index]);

  const row = (
    i: number,
    className?: string,
    label: React.ReactNode = deck.entries[i].slide.title,
  ) => (
    <button
      type="button"
      key={i}
      ref={i === index ? currentRef : undefined}
      onClick={() => onJump(i)}
      className={cn(
        "relative block w-full truncate py-1.5 pr-2 pl-4 text-left text-[13px] transition-colors hover:text-gold",
        i === index ? "text-foreground" : "text-muted-foreground",
        className,
      )}
    >
      {i === index && (
        <motion.span
          layoutId="sidebar-current"
          className="absolute inset-y-1 left-0 w-px bg-gold"
          transition={{ duration: 0.5, ease }}
        />
      )}
      {label}
    </button>
  );

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-background">
      <div className="relative border-b px-5 py-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-[0.26em] transition-colors hover:text-gold"
        >
          <ArrowLeftIcon className="size-3.5" strokeWidth={1.25} /> Back
        </button>
        <button
          type="button"
          onClick={onCollapse}
          aria-label="Hide outline (S)"
          title="Hide outline (S)"
          className="absolute top-3.5 right-3 grid size-7 place-items-center text-muted-foreground transition-colors hover:text-gold"
        >
          <PanelLeftCloseIcon className="size-4" strokeWidth={1.25} />
        </button>
        <p className="mt-4 font-title text-xl leading-snug">
          {deck.presentation.title}
        </p>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
        <div>{deck.intro.map((i) => row(i))}</div>
        {deck.sections.map((section) => (
          <div key={section.slide}>
            {row(
              section.slide,
              undefined,
              <span className="font-title text-[14px] text-foreground">
                {section.title}
              </span>,
            )}
            {section.slides.length > 0 && (
              <div className="mt-1 ml-4 border-l">
                {section.slides.map((i) => row(i))}
              </div>
            )}
            {section.subsections.map((sub) => (
              <div key={sub.slide} className="mt-1 ml-4 border-l">
                {row(
                  sub.slide,
                  "pt-2",
                  <span className="text-[9px] uppercase tracking-[0.24em]">
                    {sub.title}
                  </span>,
                )}
                {sub.slides.map((i) => row(i))}
              </div>
            ))}
          </div>
        ))}
      </nav>

      <div className="flex items-center gap-2 border-t px-4 py-3">
        <NavButton
          label="Previous (←)"
          onClick={onPrevious}
          disabled={index === 0}
        >
          <ChevronLeftIcon />
        </NavButton>
        <NavButton
          label="Next (→)"
          onClick={onNext}
          disabled={index === deck.entries.length - 1}
        >
          <ChevronRightIcon />
        </NavButton>
        <span className="flex-1" />
        <IconButton label="Calibrate a crop (C)" onClick={onCrop}>
          <CropIcon />
        </IconButton>
        <IconButton label="Export to PDF" onClick={onPdf}>
          <FileDownIcon />
        </IconButton>
        <IconButton label="Export to PowerPoint" onClick={onPptx}>
          <PresentationIcon />
        </IconButton>
        <IconButton label="Full screen (F)" onClick={onFullscreen}>
          <MaximizeIcon />
        </IconButton>
      </div>
    </aside>
  );
}

function NavButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
          className="grid size-9 place-items-center rounded-full border transition-colors duration-500 hover:border-gold hover:bg-gold hover:text-white disabled:pointer-events-none disabled:opacity-30 [&_svg]:size-4 [&_svg]:stroke-[1.25]"
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          aria-label={label}
          className="grid size-8 place-items-center text-muted-foreground transition-colors hover:text-gold [&_svg]:size-4 [&_svg]:stroke-[1.25]"
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

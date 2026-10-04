import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeftIcon,
  Loader2Icon,
  PresentationIcon,
  PrinterIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PAGE, type Presentation } from "@/presentations/types";
import { type Captures, flowerPictures, reportsFromPdf } from "./capture";
import { PageNumber, SlideChrome } from "./chrome";
import { CompareStage } from "./compare-stage";
import { buildDeck, GOLD } from "./deck";
import { layoutOf } from "./layouts";
import { PptxDialog } from "./pptx-dialog";
import { downloadPptx } from "./pptx-export";
import { ReportStage } from "./report-stage";
import { StillContext } from "./ui";

/**
 * Every slide of the presentation one under the other, in its final state (all items revealed, no
 * entrance animation), one slide per printed page: "Save as PDF" in the browser's print dialog.
 */
export function PrintView({ presentation }: { presentation: Presentation }) {
  const deck = useMemo(() => buildDeck(presentation), [presentation]);
  const navigate = useNavigate({ from: "/presentation" });
  const total = deck.entries.length;
  const size = presentation.page ?? PAGE;
  const [loading, setLoading] = useState<string | null>(null);

  // PowerPoint: the report pictures are cut out of the PDF exported from this view (chosen in the
  // dialog), the flowers are drawn from our SVG; without a PDF, the reports stay placeholders.
  const [pptxOpen, setPptxOpen] = useState(false);
  const powerPoint = async (pdf?: File) => {
    setPptxOpen(false);
    let captures: Captures = new Map();
    try {
      if (pdf) captures = await reportsFromPdf(pdf, setLoading);
    } catch (error) {
      setLoading(null);
      toast.error("This PDF cannot be used", {
        description: error instanceof Error ? error.message : String(error),
      });
      return;
    }
    try {
      setLoading("Drawing the flowers…");
      captures = await flowerPictures(captures);
    } catch (error) {
      console.warn("Flowers left out", error);
    } finally {
      setLoading(null);
    }
    await downloadPptx(presentation, captures);
  };

  // Power BI only draws a report once it is on screen: show every report slide in turn
  // (and give it time to render) before opening the print dialog.
  const print = async () => {
    const slides = [
      ...document.querySelectorAll<HTMLElement>(".print-slide"),
    ].filter((el) => el.querySelector("iframe"));
    for (const [i, el] of slides.entries()) {
      setLoading(`Loading the reports ${i + 1} / ${slides.length}…`);
      el.scrollIntoView({ block: "center" });
      await new Promise((r) => setTimeout(r, 1800));
    }
    setLoading(null);
    window.scrollTo(0, 0);
    window.print();
  };

  return (
    <StillContext.Provider value={true}>
      <PptxDialog
        open={pptxOpen}
        onOpenChange={setPptxOpen}
        onPdf={(file) => void powerPoint(file)}
        onWithout={() => void powerPoint()}
      />
      <div className="print-toolbar sticky top-0 z-40 flex items-center gap-4 border-b bg-white/95 px-6 py-3 backdrop-blur">
        <button
          type="button"
          onClick={() =>
            void navigate({ search: (s) => ({ ...s, print: undefined }) })
          }
          className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-[0.26em] transition-colors hover:text-gold"
        >
          <ArrowLeftIcon className="size-3.5" strokeWidth={1.25} /> Back
        </button>
        <p className="font-title text-sm">{presentation.title}</p>
        <p className="ml-auto hidden text-muted-foreground text-xs sm:block">
          {loading ?? "Each report is shown in turn before printing."}
        </p>
        <button
          type="button"
          onClick={() => setPptxOpen(true)}
          disabled={!!loading}
          className="flex h-8 items-center gap-2 border px-4 text-[10px] uppercase tracking-[0.22em] transition-colors hover:border-gold hover:text-gold disabled:opacity-60"
        >
          <PresentationIcon className="size-3.5" strokeWidth={1.5} /> PowerPoint
        </button>
        <button
          type="button"
          onClick={() => void print()}
          disabled={!!loading}
          className="flex h-8 items-center gap-2 bg-foreground px-4 text-[10px] text-background uppercase tracking-[0.22em] disabled:opacity-60"
        >
          {loading ? (
            <Loader2Icon className="size-3.5 animate-spin" />
          ) : (
            <PrinterIcon className="size-3.5" strokeWidth={1.5} />
          )}{" "}
          Save as PDF
        </button>
      </div>

      <div className="still mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8 print:max-w-none print:gap-0 print:p-0">
        {deck.entries.map(({ slide }, index) => {
          const layout = layoutOf(slide);
          return (
            <section
              key={index}
              className="print-slide relative aspect-video w-full overflow-hidden bg-white shadow-[0_0_0_1px_rgb(38_34_29/0.08)] [container-type:inline-size] print:shadow-none"
              style={{ "--tone": GOLD } as React.CSSProperties}
            >
              <layout.Component
                slide={slide}
                deck={deck}
                index={index}
                go={() => undefined}
                step={Infinity}
              />
              {layout.chrome ? (
                <SlideChrome slide={slide} index={index} total={total} />
              ) : (
                <PageNumber index={index} total={total} />
              )}
              {(slide.layout === "visual" || slide.layout === "report") && (
                <ReportStage
                  src={slide.report ?? presentation.reportUrl}
                  crop={
                    slide.layout === "visual"
                      ? (slide.crop ?? { x: 0, y: 0, w: size.w, h: size.h })
                      : null
                  }
                  scroll={slide.layout === "report"}
                  page={presentation.page}
                />
              )}
              {slide.layout === "compare" && (
                <CompareStage
                  before={slide.before}
                  after={slide.after}
                  reportUrl={presentation.reportUrl}
                  page={presentation.page}
                  still
                />
              )}
            </section>
          );
        })}
      </div>
    </StillContext.Provider>
  );
}

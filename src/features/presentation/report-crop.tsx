import { useState } from "react";
import { cn } from "@/lib/utils";
import { type Crop, PAGE, type PageSize } from "@/presentations/types";
import { MockReport } from "./mock-report";

/**
 * Cropped display of a report page — pure CSS, responsive.
 * The page (iframe) is enlarged so that `crop.w` fills 100% of the container, then translated:
 * percentages of the iframe's own size make it independent of the screen size.
 * Empty `src` → mock report (same geometry), handy to design slides before the real report exists.
 */
export function ReportCrop({
  src,
  crop,
  page = PAGE,
  className,
}: {
  src?: string;
  crop: Crop;
  page?: PageSize;
  className?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const style: React.CSSProperties = {
    display: "block",
    border: 0,
    // the page is enlarged so that the "crop.w" zone takes 100% of the container
    width: `${(page.w / crop.w) * 100}%`,
    height: "auto",
    aspectRatio: `${page.w} / ${page.h}`,
    // translate in % = % of the element's own size → independent of the screen
    transform: `translate(-${(crop.x / page.w) * 100}%, -${(crop.y / page.h) * 100}%)`,
    transformOrigin: "0 0",
  };

  return (
    <div
      className={cn("relative w-full overflow-hidden bg-white", className)}
      style={{ aspectRatio: `${crop.w} / ${crop.h}` }}
    >
      {src ? (
        <>
          {!loaded && (
            <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted to-muted/40" />
          )}
          <iframe
            src={src}
            title="Power BI report"
            allowFullScreen
            onLoad={() => setLoaded(true)}
            style={style}
          />
        </>
      ) : (
        <MockReport style={style} />
      )}
    </div>
  );
}

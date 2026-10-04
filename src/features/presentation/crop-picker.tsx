import { CheckIcon, CopyIcon } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { type Crop, PAGE, type PageSize } from "@/presentations/types";
import { ReportCrop } from "./report-crop";

type Mode = "crop" | "interact";
type Point = { x: number; y: number };

const MODES: { value: Mode; label: string }[] = [
  { value: "crop", label: "Area" },
  { value: "interact", label: "Interact" },
];

/**
 * Calibration tool on the whole report page, in "page px":
 * - Zone: draw the rectangle shown on the slide → `crop`
 * - Interagir: use the report (change page, filters…) before calibrating
 */
export function CropPicker({
  open,
  onOpenChange,
  src,
  page = PAGE,
  initial,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  src?: string;
  page?: PageSize;
  initial?: Crop;
}) {
  const [crop, setCrop] = useState<Crop | undefined>(initial);
  const [mode, setMode] = useState<Mode>("crop");
  const [copied, setCopied] = useState(false);
  const area = useRef<HTMLDivElement>(null);
  const start = useRef<Point | null>(null);

  const toPage = (e: React.PointerEvent) => {
    const rect = area.current!.getBoundingClientRect();
    const clamp = (v: number, max: number) =>
      Math.round(Math.min(max, Math.max(0, v)));
    return {
      x: clamp(((e.clientX - rect.left) / rect.width) * page.w, page.w),
      y: clamp(((e.clientY - rect.top) / rect.height) * page.h, page.h),
    };
  };
  const pct = (v: number, of: number) => `${(v / of) * 100}%`;

  const text = crop?.w
    ? `crop: { x: ${crop.x}, y: ${crop.y}, w: ${crop.w}, h: ${crop.h} },`
    : "";

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setCrop(initial);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-[min(96vw,1400px)] gap-5 bg-background sm:max-w-[min(96vw,1400px)]">
        <DialogHeader>
          <DialogDescription className="eyebrow">
            Calibration tool
          </DialogDescription>
          <DialogTitle className="font-normal font-title text-2xl">
            Report area
          </DialogTitle>
        </DialogHeader>

        <div
          className="relative overflow-hidden border"
          style={{ aspectRatio: `${page.w} / ${page.h}` }}
        >
          <ReportCrop
            src={src}
            crop={{ x: 0, y: 0, w: page.w, h: page.h }}
            page={page}
          />
          <div
            ref={area}
            className={cn(
              "absolute inset-0 touch-none select-none",
              mode === "interact" ? "pointer-events-none" : "cursor-crosshair",
            )}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              start.current = toPage(e);
              setCrop({ ...start.current, w: 0, h: 0 });
            }}
            onPointerMove={(e) => {
              if (!start.current) return;
              const p = toPage(e);
              const s = start.current;
              setCrop({
                x: Math.min(s.x, p.x),
                y: Math.min(s.y, p.y),
                w: Math.abs(p.x - s.x),
                h: Math.abs(p.y - s.y),
              });
            }}
            onPointerUp={() => (start.current = null)}
          >
            {crop && crop.w > 0 && (
              <div
                className="pointer-events-none absolute border border-gold shadow-[0_0_0_9999px_rgb(38_34_29/0.45)]"
                style={{
                  left: pct(crop.x, page.w),
                  top: pct(crop.y, page.h),
                  width: pct(crop.w, page.w),
                  height: pct(crop.h, page.h),
                }}
              >
                <span className="absolute -top-6 left-0 whitespace-nowrap bg-gold px-1.5 py-0.5 text-[10px] text-white tabular-nums tracking-wider">
                  {crop.w} × {crop.h}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex border">
            {MODES.map(({ value, label }) => (
              <button
                type="button"
                key={value}
                onClick={() => setMode(value)}
                className={cn(
                  "px-4 py-2 text-[10px] uppercase tracking-[0.22em] transition-colors",
                  mode === value
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <code className="min-w-0 flex-1 truncate whitespace-pre border bg-card px-3 py-2 text-xs">
            {text || "Draw an area…"}
          </code>
          <button
            type="button"
            disabled={!text}
            onClick={() => {
              void navigator.clipboard.writeText(text).then(() => {
                setCopied(true);
                toast.success("Copied");
                setTimeout(() => setCopied(false), 1500);
              });
            }}
            className="flex items-center gap-2 bg-foreground px-4 py-2 text-[10px] text-background uppercase tracking-[0.22em] disabled:opacity-40"
          >
            {copied ? (
              <CheckIcon className="size-3.5" />
            ) : (
              <CopyIcon className="size-3.5" />
            )}{" "}
            Copy
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

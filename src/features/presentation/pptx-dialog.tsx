import { FileUpIcon } from "lucide-react";
import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * PowerPoint export: asks for the PDF exported from the print view (its pages hold the Power BI
 * reports, which the page itself cannot read), or exports without the report pictures.
 */
export function PptxDialog({
  open,
  onOpenChange,
  onPdf,
  onWithout,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPdf: (file: File) => void;
  onWithout: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const pick = (file?: File) => {
    if (file) onPdf(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-normal font-title">
            Export to PowerPoint
          </DialogTitle>
          <DialogDescription>
            The reports are taken from the PDF of this view: export it first
            with “Save as PDF”, then drop it here. Nothing leaves your browser.
          </DialogDescription>
        </DialogHeader>
        <button
          type="button"
          onClick={() => input.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            pick(e.dataTransfer.files[0]);
          }}
          className={cn(
            "flex h-36 w-full flex-col items-center justify-center gap-2 border border-dashed text-muted-foreground text-sm transition-colors",
            over
              ? "border-gold bg-background text-foreground"
              : "hover:border-gold hover:text-foreground",
          )}
        >
          <FileUpIcon className="size-6 text-gold" strokeWidth={1.25} />
          Drop the PDF or click to choose it
        </button>
        <input
          ref={input}
          type="file"
          accept="application/pdf"
          hidden
          onChange={(e) => pick(e.target.files?.[0])}
        />
        <button
          type="button"
          onClick={onWithout}
          className="mx-auto text-muted-foreground text-xs underline-offset-4 hover:text-foreground hover:underline"
        >
          Export without the report pictures
        </button>
      </DialogContent>
    </Dialog>
  );
}

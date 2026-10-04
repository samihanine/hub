import { ImagePlusIcon, LinkIcon, Loader2Icon, XIcon } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { SpImage } from "@/components/sp-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Field, Value } from "@/tables/schema";
import { OptionBadge } from "./values";

/** Input of one field, following its type. */
export function FieldInput({
  field,
  value,
  onChange,
  uploadImage,
}: {
  field: Field;
  value: Value;
  onChange: (value: Value) => void;
  uploadImage?: (file: File) => Promise<string>;
}) {
  switch (field.type) {
    case "option": {
      const selected = [value].flat().filter(Boolean).map(String);
      return (
        <div className="flex flex-wrap gap-1.5">
          {(field.options ?? []).map((option) => {
            const on = selected.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  onChange(
                    field.multiple
                      ? on
                        ? selected.filter((v) => v !== option.value)
                        : [...selected, option.value]
                      : on
                        ? null
                        : option.value,
                  )
                }
                className={cn(
                  "rounded-sm transition-all",
                  !on &&
                    "opacity-40 grayscale hover:opacity-80 hover:grayscale-0",
                )}
              >
                <OptionBadge option={option} />
              </button>
            );
          })}
        </div>
      );
    }
    case "boolean":
      return (
        <Switch
          checked={value === true}
          onCheckedChange={(checked) => onChange(checked)}
        />
      );
    case "text":
      return (
        <Textarea
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value || null)}
          rows={4}
          placeholder="Text (**bold**, line breaks)"
        />
      );
    case "image":
      return (
        <ImageInput
          value={value ? String(value) : null}
          onChange={onChange}
          upload={uploadImage}
        />
      );
    default: {
      const text = Array.isArray(value)
        ? value.join("; ")
        : value === null
          ? ""
          : String(value);
      return (
        <Input
          value={text}
          type={
            field.type === "number"
              ? "number"
              : field.type === "date"
                ? "date"
                : field.type === "url" && !field.multiple
                  ? "url"
                  : "text"
          }
          step="any"
          placeholder={
            field.multiple
              ? "Values separated by ;"
              : field.type === "url"
                ? "https://…"
                : undefined
          }
          onChange={(e) => {
            const input = e.target.value;
            onChange(
              field.multiple
                ? input.split(/\s*;\s*/).filter(Boolean)
                : field.type === "number"
                  ? input === ""
                    ? null
                    : Number(input)
                  : input || null,
            );
          }}
        />
      );
    }
  }
}

/** Upload to the SharePoint folder of the table, or paste a link. */
function ImageInput({
  value,
  onChange,
  upload,
}: {
  value: string | null;
  onChange: (value: Value) => void;
  upload?: (file: File) => Promise<string>;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const send = async (file: File | undefined) => {
    if (!file || !upload) return;
    setBusy(true);
    try {
      onChange(await upload(file));
    } catch (error) {
      toast.error("Image upload failed", {
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      {value ? (
        <div className="group relative overflow-hidden rounded-xl border bg-muted/40">
          <SpImage
            src={value}
            className="max-h-56 min-h-28 w-full object-contain"
          />
          <Button
            type="button"
            size="icon-sm"
            variant="secondary"
            onClick={() => onChange(null)}
            className="absolute top-2 right-2 opacity-0 shadow transition-opacity group-hover:opacity-100"
            aria-label="Remove image"
          >
            <XIcon />
          </Button>
        </div>
      ) : upload ? (
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            void send(e.dataTransfer.files[0]);
          }}
          className="flex h-28 w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed text-muted-foreground text-sm transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
        >
          {busy ? (
            <Loader2Icon className="size-5 animate-spin" />
          ) : (
            <ImagePlusIcon className="size-5" />
          )}
          {busy ? "Uploading…" : "Drop an image or click"}
        </button>
      ) : null}
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => void send(e.target.files?.[0])}
      />
      {!value?.startsWith("data:") && (
        <div className="relative">
          <LinkIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value || null)}
            placeholder="…or paste an image link"
            className="pl-8"
          />
        </div>
      )}
    </div>
  );
}

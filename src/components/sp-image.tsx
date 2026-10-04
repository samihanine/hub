import { useQuery } from "@tanstack/react-query";
import { ImageOffIcon } from "lucide-react";
import { useState } from "react";
import { callConnector, DATA_MODE, SHAREPOINT_SOURCE } from "@/lib/power-apps";
import { siteOf, sitePath } from "@/lib/sharepoint";
import { cn } from "@/lib/utils";

const isSharePoint = (src: string) => {
  try {
    return new URL(src).hostname.endsWith(".sharepoint.com");
  } catch {
    return false;
  }
};

const MIME: Record<string, string> = {
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  bmp: "image/bmp",
};
const mimeOf = (src: string) =>
  MIME[src.split("?")[0].split(".").pop()?.toLowerCase() ?? ""] ?? "image/jpeg";

/**
 * SharePoint file → displayable url, through the SharePoint connector (works inside the Power Apps
 * iframe, where direct <img src="…sharepoint.com…"> is often blocked by third-party cookie rules).
 */
async function loadSharePointImage(src: string) {
  const data = await callConnector<unknown>(
    SHAREPOINT_SOURCE!,
    "GetFileContentByPath",
    {
      dataset: siteOf(src),
      path: sitePath(src),
      inferContentType: true,
    },
  );
  // image/* responses come back as base64, octet-stream as bytes.
  if (typeof data === "string") return `data:${mimeOf(src)};base64,${data}`;
  if (data instanceof Uint8Array || data instanceof ArrayBuffer)
    return URL.createObjectURL(
      new Blob([data as BlobPart], { type: mimeOf(src) }),
    );
  throw new Error("Unexpected image content");
}

/** <img> that also works for files stored in SharePoint / OneDrive. */
export function SpImage({
  src,
  className,
  alt = "",
}: {
  src: string;
  className?: string;
  alt?: string;
}) {
  const viaConnector =
    DATA_MODE === "connector" && !!SHAREPOINT_SOURCE && isSharePoint(src);
  const {
    data: url,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["sp-image", src],
    queryFn: () => loadSharePointImage(src),
    enabled: viaConnector,
    staleTime: Infinity,
    gcTime: 30 * 60_000,
  });
  const [broken, setBroken] = useState(false);

  if (viaConnector && isLoading)
    return <span className={cn("block animate-pulse bg-muted", className)} />;
  // Connector failed: fall back to the direct url (works when the browser has a SharePoint session).
  const finalSrc = viaConnector && !isError ? url : src;
  if (broken || !finalSrc)
    return (
      <span
        className={cn(
          "grid place-items-center bg-muted text-muted-foreground",
          className,
        )}
        title={src}
      >
        <ImageOffIcon className="size-4" />
      </span>
    );
  return (
    <img
      src={finalSrc}
      alt={alt}
      loading="lazy"
      onError={() => setBroken(true)}
      className={className}
    />
  );
}

/*
 * Pictures for the PowerPoint export (pptx-export.ts):
 * - reports: a Power BI report is a cross-origin frame, the page cannot read its pixels. But the PDF
 *   exported from the print view contains them, and a file chosen by the user can be read: its pages
 *   are drawn with pdf.js and each report frame is cut out at the position it has on the slide
 *   (measured on the print view, which is laid out exactly like the PDF pages).
 * - flowers: our own SVG, turned into a transparent PNG.
 */

/** A picture (PNG data url) and its size in css px of the print view. */
export type Capture = { data: string; w: number; h: number };
/** Per slide index: its report frame and / or its flowers, as pictures. */
export type Captures = Map<number, { report?: Capture; toile?: Capture }>;

/** Position of an element on its slide, as fractions of the slide size. */
type Box = {
  x: number;
  y: number;
  w: number;
  h: number;
  cssW: number;
  cssH: number;
};

const boxIn = (el: Element, slide: Element): Box => {
  const r = el.getBoundingClientRect();
  const s = slide.getBoundingClientRect();
  return {
    x: (r.left - s.left) / s.width,
    y: (r.top - s.top) / s.height,
    w: r.width / s.width,
    h: r.height / s.height,
    cssW: r.width,
    cssH: r.height,
  };
};

/** Slides of the print view (one per PDF page). */
const printSlides = () => [
  ...document.querySelectorAll<HTMLElement>(".print-slide"),
];

/**
 * Report frames cut out of the PDF exported from the print view.
 * Throws if the file is not a PDF of this presentation (page count / page shape).
 */
export async function reportsFromPdf(
  file: File,
  onProgress: (message: string) => void,
): Promise<Captures> {
  const pdfjs = await import("pdfjs-dist");
  const { default: workerUrl } = await import(
    "pdfjs-dist/build/pdf.worker.min.mjs?url"
  );
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const slides = printSlides();
  const pdf = await pdfjs.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
  }).promise;
  // (an older export may end with one blank page)
  if (pdf.numPages !== slides.length && pdf.numPages !== slides.length + 1)
    throw new Error(
      `This PDF has ${pdf.numPages} pages, the presentation ${slides.length} slides: export the PDF again from this view.`,
    );

  const captures: Captures = new Map();
  const todo = slides
    .map((slide, index) => ({
      index,
      frame: slide.querySelector("[data-capture=report]"),
    }))
    .filter((t): t is { index: number; frame: Element } => !!t.frame);

  for (const [n, { index, frame }] of todo.entries()) {
    onProgress(`Reading the reports ${n + 1} / ${todo.length}…`);
    const box = boxIn(frame, slides[index]);
    const page = await pdf.getPage(index + 1);
    const base = page.getViewport({ scale: 1 });
    if (Math.abs(base.width / base.height - 16 / 9) > 0.05)
      throw new Error(
        "The PDF pages are not 16:9: export the PDF again from this view (margins: default).",
      );
    // ~2400 px wide pages: sharp report pictures
    const viewport = page.getViewport({ scale: 2400 / base.width });
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    await page.render({ canvas, viewport }).promise;

    const crop = document.createElement("canvas");
    crop.width = Math.round(box.w * canvas.width);
    crop.height = Math.round(box.h * canvas.height);
    crop
      .getContext("2d")!
      .drawImage(
        canvas,
        box.x * canvas.width,
        box.y * canvas.height,
        crop.width,
        crop.height,
        0,
        0,
        crop.width,
        crop.height,
      );
    captures.set(index, {
      report: { data: crop.toDataURL("image/png"), w: box.cssW, h: box.cssH },
    });
    page.cleanup();
  }
  await pdf.cleanup();
  return captures;
}

/** Style properties that shape the flowers (copied inline, the stylesheet does not follow the SVG). */
const SVG_PROPS = [
  "fill",
  "fill-opacity",
  "stroke",
  "stroke-width",
  "stroke-opacity",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-dasharray",
  "stroke-dashoffset",
  "opacity",
  "transform",
  "transform-origin",
  "transform-box",
  "visibility",
  "display",
];

/** An SVG of the page as a transparent PNG (computed styles inlined, final state of the animations). */
async function svgToPng(svg: SVGSVGElement): Promise<Capture> {
  const rect = svg.getBoundingClientRect();
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const source = [svg, ...svg.querySelectorAll("*")];
  const target = [clone, ...clone.querySelectorAll("*")];
  source.forEach((el, i) => {
    const computed = getComputedStyle(el);
    const out = target[i] as SVGElement;
    out.removeAttribute("class");
    out.setAttribute(
      "style",
      SVG_PROPS.map((p) => `${p}:${computed.getPropertyValue(p)}`).join(";") +
        ";animation:none",
    );
  });
  const scale = 2;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(rect.width * scale));
  clone.setAttribute("height", String(rect.height * scale));
  const url = URL.createObjectURL(
    new Blob([new XMLSerializer().serializeToString(clone)], {
      type: "image/svg+xml",
    }),
  );
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(rect.width * scale);
    canvas.height = Math.round(rect.height * scale);
    canvas
      .getContext("2d")!
      .drawImage(image, 0, 0, canvas.width, canvas.height);
    return {
      data: canvas.toDataURL("image/png"),
      w: rect.width,
      h: rect.height,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** The flowers of the print view slides (cover, subsections), as transparent PNGs. */
export async function flowerPictures(
  captures: Captures = new Map(),
): Promise<Captures> {
  const slides = printSlides();
  for (const [index, slide] of slides.entries()) {
    const svg = slide.querySelector<SVGSVGElement>("svg[data-toile]");
    if (!svg) continue;
    const entry = captures.get(index) ?? {};
    entry.toile = await svgToPng(svg);
    captures.set(index, entry);
  }
  return captures;
}

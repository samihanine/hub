import type PptxGenJS from "pptxgenjs";
import { toast } from "sonner";
import { BRAND_MARK } from "@/lib/app-config";
import type { Point, Presentation, Slide } from "@/presentations/types";
import type { Capture, Captures } from "./capture";
import { buildDeck, type Deck } from "./deck";
import { asPoint, type Lead, pad, picture } from "./ui";

/*
 * PowerPoint export: every slide rebuilt with native text boxes and shapes (editable), in its final
 * state (no animation). Same composition as the slides. Power BI visuals (cut out of the exported
 * PDF) and the toile flowers (our SVG as PNG) come as pictures when given (`captures`, see
 * capture.ts); otherwise the
 * visuals become a placeholder linking to the report and the flowers are left out;
 * fonts are named (Futura Bk BT, Century Gothic, Bodoni MT) and used if installed.
 * Positions are given in cqw (1% of the slide width), like the layouts.
 */

type PptSlide = PptxGenJS.Slide;
type TextRun = PptxGenJS.TextProps;
type TextOptions = PptxGenJS.TextPropsOptions;

const W = 13.333; // LAYOUT_WIDE, inches
const H = 56.25; // slide height in cqw (16:9)
const u = (cqw: number) => (cqw * W) / 100; // cqw → inches
const pt = (cqw: number) => Math.round(cqw * 9.6 * 10) / 10; // cqw → points (960 pt wide)

const C = {
  ink: "26221D",
  muted: "7B7266",
  gold: "B08D57",
  beige: "F8F4EC",
  toile: "2A4F93",
  line: "E4DED3",
  white: "FFFFFF",
};
const FONT = {
  title: "Futura Bk BT",
  text: "Century Gothic",
  mark: "Bodoni MT",
};

/** Hex colour mixed with white (0 = colour, 1 = white): lighter text without transparency support. */
const lighten = (hex: string, k: number) => {
  const n = parseInt(hex, 16);
  const ch = (shift: number) => {
    const v = (n >> shift) & 255;
    return Math.round(v + (255 - v) * k)
      .toString(16)
      .padStart(2, "0");
  };
  return `${ch(16)}${ch(8)}${ch(0)}`.toUpperCase();
};

/* ---------------------------- Text helpers ---------------------------- */

/** Inline markup (**bold**, ==gold==, *italic*) → text runs. */
function runs(text: string, base: TextOptions = {}, gold = C.gold): TextRun[] {
  return text
    .split(/(\*\*[^*]+\*\*|==[^=]+==|\*[^*]+\*)/g)
    .filter(Boolean)
    .map((part) =>
      part.startsWith("**")
        ? {
            text: part.slice(2, -2),
            options: { ...base, bold: true, color: C.ink },
          }
        : part.startsWith("==")
          ? {
              text: part.slice(2, -2),
              options: { ...base, bold: true, color: gold },
            }
          : part.length > 2 && part.startsWith("*") && part.endsWith("*")
            ? { text: part.slice(1, -1), options: { ...base, italic: true } }
            : { text: part, options: base },
    );
}

/** Ends a paragraph: line break after its last run. */
const paragraph = (items: TextRun[]): TextRun[] => {
  if (!items.length) return items;
  const last = items[items.length - 1];
  return [
    ...items.slice(0, -1),
    { ...last, options: { ...last.options, breakLine: true } },
  ];
};

/** Minimal markdown (## / ### headings, "- " lists, "> " quotes, paragraphs) → text runs. */
function markdown(
  text: string,
  size: number,
  color = C.muted,
  gold = C.gold,
): TextRun[] {
  const out: TextRun[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const base: TextOptions = {
      fontFace: FONT.text,
      fontSize: size,
      color,
      paraSpaceAfter: 6,
    };
    if (line.startsWith("## "))
      out.push(
        ...paragraph(
          runs(line.slice(3), {
            ...base,
            fontFace: FONT.title,
            fontSize: size * 1.6,
            color: C.ink,
          }),
        ),
      );
    else if (line.startsWith("### "))
      out.push(
        ...paragraph(
          runs(line.slice(4).toUpperCase(), {
            ...base,
            fontSize: size * 0.75,
            color: C.muted,
            charSpacing: 3,
          }),
        ),
      );
    else if (line.startsWith("- "))
      out.push(
        ...paragraph(
          runs(line.slice(2), { ...base, bullet: { indent: 12 } }, gold),
        ),
      );
    else if (line.startsWith("> "))
      out.push(
        ...paragraph(runs(line.slice(2), { ...base, italic: true }, gold)),
      );
    else out.push(...paragraph(runs(line, base, gold)));
  }
  return out;
}

const leadText = (lead: Lead) => (typeof lead === "string" ? lead : lead.text);
const leadColor = (lead: Lead) =>
  typeof lead !== "string" && lead.color?.startsWith("#")
    ? lead.color.slice(1).toUpperCase()
    : C.gold;

/* ---------------------------- Shape helpers ---------------------------- */

type Ctx = {
  pptx: PptxGenJS;
  s: PptSlide;
  deck: Deck;
  index: number;
  images: Map<string, string>;
  /** Screenshots of this slide (report frame, flowers), when the export captured them. */
  capture?: { report?: Capture; toile?: Capture };
};

/** pptxgenjs wants "image/png;base64,…" (no "data:" prefix). */
const imageData = (dataUrl: string) => dataUrl.replace(/^data:/, "");

/** The captured report frame, fitted (contain) and centred in the box; false if none was captured. */
function capturedReport(
  c: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  url?: string,
) {
  const shot = c.capture?.report;
  if (!shot) return false;
  const aspect = shot.w / shot.h;
  const dw = Math.min(w, h * aspect);
  const dh = dw / aspect;
  c.s.addImage({
    data: imageData(shot.data),
    x: u(x + (w - dw) / 2),
    y: u(y + (h - dh) / 2),
    w: u(dw),
    h: u(dh),
    // pptxgenjs writes an image's link as is in the XML: "&" must be escaped (or the file is corrupt)
    ...(url ? { hyperlink: { url: url.replace(/&/g, "&amp;") } } : {}),
  });
  return true;
}

function rect(
  c: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string | null,
  line?: string,
) {
  c.s.addShape(c.pptx.ShapeType.rect, {
    x: u(x),
    y: u(y),
    w: u(w),
    h: u(h),
    fill: fill ? { color: fill } : { type: "none" },
    line: line ? { color: line, width: 0.75 } : { type: "none" },
  });
}
function hline(
  c: Ctx,
  x: number,
  y: number,
  w: number,
  color = C.line,
  width = 0.75,
) {
  c.s.addShape(c.pptx.ShapeType.line, {
    x: u(x),
    y: u(y),
    w: u(w),
    h: 0,
    line: { color, width },
  });
}
function circle(
  c: Ctx,
  cx: number,
  cy: number,
  d: number,
  fill: string | null,
  line?: string,
) {
  c.s.addShape(c.pptx.ShapeType.ellipse, {
    x: u(cx - d / 2),
    y: u(cy - d / 2),
    w: u(d),
    h: u(d),
    fill: fill ? { color: fill } : { type: "none" },
    line: line ? { color: line, width: 0.75 } : { type: "none" },
  });
}
function text(
  c: Ctx,
  value: string | TextRun[],
  x: number,
  y: number,
  w: number,
  h: number,
  options: TextOptions = {},
) {
  c.s.addText(value, {
    x: u(x),
    y: u(y),
    w: u(w),
    h: u(h),
    margin: 0,
    fontFace: FONT.text,
    color: C.ink,
    valign: "top",
    fit: "shrink",
    ...options,
  });
}
/** Small spaced capitals (eyebrows). */
function eyebrow(
  c: Ctx,
  value: string,
  x: number,
  y: number,
  w: number,
  align: "left" | "center" = "left",
) {
  text(c, value.toUpperCase(), x, y, w, 1.6, {
    fontSize: pt(0.8),
    color: C.muted,
    charSpacing: 4,
    align,
    valign: "middle",
  });
}
/** The house mark: whole word (logo) or first letter. */
function mark(c: Ctx, x: number, y: number, size: number, full = false) {
  text(
    c,
    full ? BRAND_MARK : BRAND_MARK.charAt(0),
    x,
    y,
    size * (full ? BRAND_MARK.length * 0.75 : 1.2),
    size * 1.3,
    {
      fontFace: FONT.mark,
      fontSize: pt(size),
      color: "111111",
      valign: "middle",
    },
  );
}
function image(
  c: Ctx,
  url: string | undefined,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const data = url && c.images.get(url);
  if (data)
    c.s.addImage({
      data,
      x: u(x),
      y: u(y),
      w: u(w),
      h: u(h),
      sizing: { type: "cover", w: u(w), h: u(h) },
    });
  else rect(c, x, y, w, h, C.beige);
}

/** Header of content slides: logo, hairline, slide title. */
function chrome(c: Ctx, title: string) {
  mark(c, 4, 1.9, 2.1, true);
  hline(c, 13, 3.3, 52, lighten(C.ink, 0.85));
  text(c, title, 66, 2.3, 30, 2.2, {
    fontFace: FONT.title,
    fontSize: pt(1.6),
    align: "right",
    valign: "middle",
  });
}
function pageNumber(c: Ctx) {
  text(c, `${c.index + 1} / ${c.deck.entries.length}`, 86, 53.4, 10, 1.4, {
    fontFace: FONT.title,
    fontSize: pt(0.8),
    color: C.muted,
    align: "right",
  });
}
/** Lead band: beige strip, gold marker, key sentence. */
function band(c: Ctx, lead: Lead, x = 4, y = 8.4, w = 92) {
  rect(c, x, y, w, 4, C.beige);
  circle(c, x + 2.4, y + 2, 1.2, null, leadColor(lead));
  text(
    c,
    runs(leadText(lead), { fontSize: pt(1.2), color: C.muted }),
    x + 4.2,
    y,
    w - 5.6,
    4,
    { valign: "middle" },
  );
}
/** Numbered circle. */
function num(
  c: Ctx,
  n: number,
  cx: number,
  cy: number,
  d: number,
  filled: boolean,
) {
  circle(c, cx, cy, d, filled ? C.gold : null, filled ? undefined : C.gold);
  text(c, pad(n), cx - d / 2, cy - d / 2, d, d, {
    fontFace: FONT.title,
    fontSize: pt(d * 0.4),
    color: filled ? C.white : C.gold,
    align: "center",
    valign: "middle",
  });
}
/** Placeholder of a Power BI visual (cannot be captured): frame + link to the report. */
function reportBox(
  c: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  url?: string,
) {
  if (capturedReport(c, x, y, w, h, url)) return;
  rect(c, x, y, w, h, "F3F0EA", lighten(C.ink, 0.88));
  text(
    c,
    [
      {
        text: "POWER BI",
        options: {
          fontSize: pt(0.8),
          color: C.gold,
          charSpacing: 4,
          breakLine: true,
        },
      },
      {
        text: label,
        options: {
          fontFace: FONT.title,
          fontSize: pt(1.4),
          color: C.ink,
          breakLine: true,
        },
      },
      {
        text: url ? "Open the report" : "Interactive visual in the app",
        options: {
          fontSize: pt(0.9),
          color: C.muted,
          ...(url ? { hyperlink: { url } } : {}),
        },
      },
    ],
    x + 2,
    y,
    w - 4,
    h,
    { align: "center", valign: "middle" },
  );
}

/* ---------------------------- Layouts ---------------------------- */

const LAYOUTS: {
  [K in Slide["layout"]]: (
    c: Ctx,
    slide: Extract<Slide, { layout: K }>,
  ) => void;
} = {
  cover: (c, slide) => {
    const p = c.deck.presentation;
    rect(c, 2.2, 2.2, 95.6, H - 4.4, null, lighten(C.toile, 0.45));
    rect(c, 2.65, 2.65, 94.7, H - 5.3, null, lighten(C.toile, 0.75));
    mark(c, 5.4, 4.4, 2.1, true);
    if (p.context)
      text(c, p.context.toUpperCase(), 54, 4.6, 40.6, 1.6, {
        fontSize: pt(0.8),
        color: C.muted,
        charSpacing: 4,
        align: "right",
      });
    const first = c.index === 0;
    eyebrow(
      c,
      slide.eyebrow ?? (first ? "User guide" : p.title),
      24,
      17,
      52,
      "center",
    );
    hline(c, 48, 19.4, 4, C.toile);
    text(c, slide.title, 14, 21, 72, 12, {
      fontFace: FONT.title,
      fontSize: pt(5.2),
      align: "center",
      valign: "middle",
    });
    if (slide.subtitle)
      text(c, slide.subtitle, 26, 34, 48, 5, {
        fontSize: pt(1.5),
        italic: true,
        color: C.muted,
        align: "center",
      });
    const footer = [p.author, p.date].filter(Boolean).join("  —  ");
    if (footer)
      text(c, footer.toUpperCase(), 5.4, 50.4, 50, 1.6, {
        fontSize: pt(0.78),
        color: C.muted,
        charSpacing: 4,
      });
  },

  plan: (c, slide) => {
    const sections = c.deck.sections;
    eyebrow(c, c.deck.presentation.title, 6, 6.5, 26);
    hline(c, 6, 8.6, 3, C.gold);
    text(c, slide.title, 6, 18, 26, 12, {
      fontFace: FONT.title,
      fontSize: pt(4.4),
      valign: "middle",
    });
    hline(c, 6, 31.5, 4, C.gold);
    text(
      c,
      `${sections.length} parts · ${c.deck.entries.length} pages`,
      6,
      33,
      26,
      2,
      { fontSize: pt(1.05), color: C.muted },
    );
    mark(c, 6, 46, 5);
    c.s.addShape(c.pptx.ShapeType.line, {
      x: u(34),
      y: 0,
      w: 0,
      h: u(H),
      line: { color: lighten(C.ink, 0.88), width: 0.75 },
    });
    const rowH = Math.min(7.5, 40 / Math.max(sections.length, 1));
    const top = (H - rowH * sections.length) / 2;
    sections.forEach((section, i) => {
      const y = top + i * rowH;
      text(c, pad(i + 1), 38, y + 0.6, 3, 2.4, {
        fontFace: FONT.title,
        fontSize: pt(1.5),
        color: C.gold,
      });
      text(c, section.title, 43, y + 0.4, 50, 2.8, {
        fontFace: FONT.title,
        fontSize: pt(2),
      });
      if (section.subsections.length)
        text(
          c,
          section.subsections.map((s) => s.title.toUpperCase()).join("    "),
          43,
          y + 3.3,
          50,
          1.6,
          {
            fontSize: pt(0.78),
            color: C.muted,
            charSpacing: 3,
          },
        );
      hline(c, 43, y + rowH - 0.6, 50);
    });
  },

  section: (c, slide) => {
    const entry = c.deck.entries[c.index];
    const titles = ["Presentation", ...c.deck.sections.map((s) => s.title)];
    const current = entry.section + 1;
    eyebrow(
      c,
      `${pad(entry.section + 1)} — ${c.deck.presentation.title}`,
      6,
      6.5,
      36,
    );
    hline(c, 6, 8.6, 3, C.gold);
    // the wheel, in its final position: current title, two lighter ones on each side
    for (let d = -2; d <= 2; d++) {
      const i = current + d;
      if (i < 0 || i >= titles.length) continue;
      const a = Math.abs(d);
      const size = 4 * (1 - a * 0.2);
      const y =
        28 +
        Math.sign(d) * (a <= 1 ? a * 6.6 : 6.6 + (a - 1) * 4.75) -
        size * 0.75;
      const fade = a === 0 ? 0 : a === 1 ? 0.72 : 0.88;
      text(
        c,
        [
          {
            text: `${pad(i)}  `,
            options: {
              fontFace: FONT.title,
              fontSize: pt(1.4 * (1 - a * 0.2)),
              color: lighten(C.gold, fade),
            },
          },
          {
            text: titles[i],
            options: {
              fontFace: FONT.title,
              fontSize: pt(size),
              color: lighten(C.ink, fade),
            },
          },
        ],
        6,
        y,
        36,
        size * 1.5,
        { valign: "middle" },
      );
    }
    hline(c, 6, 24.6, 4, lighten(C.gold, 0.4));
    hline(c, 6, 31.4, 4, lighten(C.gold, 0.4));
    mark(c, 6, 48, 3.6);
    image(c, slide.image && picture(slide.image), 44, 0, 56, H);
  },

  subsection: (c, slide) => {
    const entry = c.deck.entries[c.index];
    const parent = c.deck.sections[entry.section];
    if (parent) eyebrow(c, parent.title, 12.6, 14, 40);
    hline(c, 12.6, 16.2, 3, C.toile);
    text(c, slide.title, 12.6, 18, 46, 7, {
      fontFace: FONT.title,
      fontSize: pt(4.6),
      valign: "middle",
    });
    if (slide.description)
      text(
        c,
        markdown(slide.description, pt(1.3), C.muted, C.toile),
        12.6,
        26,
        44,
        10,
      );
    // trail of the section
    const steps = parent?.subsections ?? [];
    const x0 = 14,
      x1 = 58,
      y = 49.35;
    hline(c, x0, y, 46, C.toile, 1.5);
    steps.forEach((step, i) => {
      const x =
        steps.length > 1 ? x0 + (i / (steps.length - 1)) * (x1 - x0) : x1;
      const here = i === entry.subsection;
      const done = i < entry.subsection;
      const d = here ? 3.6 : 2.8;
      circle(
        c,
        x,
        y,
        d,
        here ? C.toile : done ? lighten(C.toile, 0.9) : C.white,
        here ? undefined : lighten(C.toile, done ? 0 : 0.6),
      );
      text(c, pad(i + 1), x - d / 2, y - d / 2, d, d, {
        fontFace: FONT.title,
        fontSize: pt(1.05),
        color: here ? C.white : done ? C.toile : C.muted,
        align: "center",
        valign: "middle",
      });
      text(c, step.title.toUpperCase(), x - 6.5, y + 2.6, 13, 1.6, {
        fontSize: pt(0.78),
        charSpacing: 3,
        align: "center",
        bold: here,
        color: here ? C.ink : C.muted,
      });
    });
  },

  quote: (c, slide) => {
    mark(c, 47.8, 9, 4.4);
    eyebrow(c, slide.title, 16, 16, 68, "center");
    text(
      c,
      [
        { text: "“", options: { color: C.gold } },
        { text: slide.text },
        { text: "”", options: { color: C.gold } },
      ],
      16,
      19,
      68,
      16,
      {
        fontFace: FONT.title,
        fontSize: pt(3.2),
        align: "center",
        valign: "middle",
      },
    );
    hline(c, 48, 37, 4, C.gold);
    if (slide.author) eyebrow(c, slide.author, 16, 38.6, 68, "center");
  },

  markdown: (c, slide) => {
    band(c, slide.lead);
    const w = slide.image ? 80 : 62;
    const x = (100 - w) / 2;
    const y = 15.2,
      h = 33;
    rect(c, x, y, w, h, C.white, lighten(C.ink, 0.88));
    hline(c, x, y, w, C.gold, 1.5);
    const textW = slide.image ? w * 0.535 : w;
    text(c, markdown(slide.markdown, pt(1.2)), x + 4, y + 3, textW - 8, h - 6, {
      valign: "middle",
    });
    mark(c, x + textW - 4.2, y + h - 4, 2.6);
    if (slide.image)
      image(c, picture(slide.image, 1200), x + textW, y, w - textW, h);
  },

  rectangles: (c, slide) => {
    band(c, slide.lead);
    const n = slide.items.length;
    const gap = 1.6,
      top = 15.2,
      h = H - 3.6 - top;
    const w = (92 - gap * (n - 1)) / n;
    slide.items.forEach((item, i) => {
      const x = 4 + i * (w + gap);
      rect(c, x, top, w, h, C.beige);
      const body: TextRun[] = [
        ...paragraph([
          {
            text: item.title,
            options: {
              fontFace: FONT.title,
              fontSize: pt(1.95),
              color: C.ink,
              paraSpaceAfter: 8,
            },
          },
        ]),
        ...(item.text ? markdown(item.text, pt(1.12)) : []),
        ...(item.items?.length
          ? markdown(item.items.map((e) => `- ${e}`).join("\n"), pt(1.1), C.ink)
          : []),
      ];
      text(c, body, x + 2.2, top + 2.4, w - 4.4, h - 4.4);
    });
  },

  cards: (c, slide) => {
    band(c, slide.lead);
    const gap = 1.6,
      top = 15.2,
      h = (H - 3.6 - top - gap) / 2,
      w = (92 - gap * 2) / 3;
    slide.items.slice(0, 6).forEach((tile, i) => {
      const x = 4 + (i % 3) * (w + gap);
      const y = top + Math.floor(i / 3) * (h + gap);
      rect(c, x, y, w, h, C.beige);
      hline(c, x + w / 2 - 1.5, y, 3, C.gold, 1.5);
      text(
        c,
        [
          ...paragraph([
            {
              text: tile.title,
              options: {
                fontFace: FONT.title,
                fontSize: pt(3.2),
                color: C.ink,
                paraSpaceAfter: 6,
              },
            },
          ]),
          ...(tile.text
            ? [
                {
                  text: tile.text,
                  options: { fontSize: pt(1.05), color: C.muted },
                },
              ]
            : []),
        ],
        x + 2,
        y + 1,
        w - 4,
        h - 2,
        { align: "center", valign: "middle" },
      );
    });
  },

  list: (c, slide) => {
    band(c, slide.lead);
    const points = slide.points.slice(0, 8).map(asPoint);
    const two = points.length > 4;
    const perCol = two ? Math.ceil(points.length / 2) : points.length;
    const top = 15.2,
      rowH = (H - 3.6 - top) / Math.max(perCol, 1);
    const colW = two ? (92 - 3.6) / 2 : 92;
    const size = two ? 1.08 : 1.25;
    points.forEach((point, i) => {
      const col = two ? Math.floor(i / perCol) : 0;
      const x = 4 + col * (colW + 3.6);
      const y = top + (i % perCol) * rowH;
      num(c, i + 1, x + 1.3, y + rowH / 2, 2.6, true);
      const body: TextRun[] = [
        ...runs(point.title, { fontSize: pt(size), bold: true, color: C.ink }),
        ...(point.text
          ? runs(` : ${point.text}`, {
              fontSize: pt(size),
              color: lighten(C.ink, 0.25),
            })
          : []),
      ];
      const items = (point.items ?? []).flatMap((e) =>
        paragraph(
          runs(e, {
            fontSize: pt(size * 0.88),
            color: lighten(C.ink, 0.3),
            bullet: { indent: 10 },
          }),
        ),
      );
      text(
        c,
        items.length ? [...paragraph(body), ...items] : body,
        x + 4.2,
        y,
        colW - 4.2,
        rowH,
        { valign: "middle" },
      );
      hline(c, x, y + rowH, colW, lighten(C.ink, 0.92));
    });
  },

  visual: (c, slide) => {
    explanation(c, slide.lead, slide.points);
    reportBox(
      c,
      33,
      14.8,
      63,
      H - 3.6 - 14.8,
      slide.title,
      slide.report ?? c.deck.presentation.reportUrl,
    );
  },

  compare: (c, slide) => {
    explanation(c, slide.lead, slide.points);
    const url = c.deck.presentation.reportUrl;
    const h = H - 3.6 - 14.8;
    // captured: both pages and the slider, as on screen
    if (capturedReport(c, 33, 14.8, 63, h, url)) return;
    reportBox(
      c,
      33,
      14.8,
      31.5,
      h,
      slide.before.label ?? "Before",
      slide.before.report ?? url,
    );
    reportBox(
      c,
      64.5,
      14.8,
      31.5,
      h,
      slide.after.label ?? "After",
      slide.after.report ?? url,
    );
    c.s.addShape(c.pptx.ShapeType.line, {
      x: u(64.5),
      y: u(14.8),
      w: 0,
      h: u(h),
      line: { color: C.gold, width: 1.5 },
    });
  },

  report: (c, slide) => {
    band(c, slide.lead);
    reportBox(
      c,
      4,
      14,
      92,
      H - 3.6 - 14,
      slide.title,
      slide.report ?? c.deck.presentation.reportUrl,
    );
  },

  faq: (c, slide) => {
    band(c, slide.lead);
    const items = slide.items;
    const rows = Math.ceil(items.length / 2);
    const top = 15.2,
      rowH = (H - 3.6 - top) / Math.max(rows, 1),
      colW = 44;
    items.forEach(({ q, a }, i) => {
      const x = 4 + (i % 2) * (colW + 4);
      const y = top + Math.floor(i / 2) * rowH;
      hline(c, x, y, colW, lighten(C.ink, 0.88));
      text(
        c,
        [
          {
            text: "?  ",
            options: { fontFace: FONT.title, fontSize: pt(1.6), color: C.gold },
          },
          ...paragraph([
            {
              text: q,
              options: {
                fontSize: pt(1.3),
                bold: true,
                color: C.ink,
                paraSpaceAfter: 4,
              },
            },
          ]),
          ...runs(a, { fontSize: pt(1.12), color: C.muted }),
        ],
        x,
        y + 1.2,
        colW,
        rowH - 1.4,
      );
    });
  },
};

/** Lead band across the slide + beige panel of numbered points (visual and compare slides). */
function explanation(c: Ctx, lead: Lead, points: Point[] = []) {
  band(c, lead);
  const top = 14.8,
    h = H - 3.6 - top;
  rect(c, 4, top, 27, h, C.beige);
  const items = points.map(asPoint);
  const rowH = Math.min(7, (h - 6) / Math.max(items.length, 1));
  items.forEach((point, i) => {
    const y = top + 1.6 + i * rowH;
    num(c, i + 1, 6.6, y + 0.9, 1.7, false);
    const body: TextRun[] = [
      ...paragraph(
        runs(point.title, { fontSize: pt(1.05), bold: true, color: C.ink }),
      ),
      ...(point.text
        ? paragraph(runs(point.text, { fontSize: pt(0.95), color: C.muted }))
        : []),
      ...(point.items ?? []).flatMap((e) =>
        paragraph(
          runs(e, { fontSize: pt(0.9), color: C.muted, bullet: { indent: 8 } }),
        ),
      ),
    ];
    text(c, body, 8.6, y, 21, rowH - 0.4);
  });
  mark(c, 5.8, H - 3.6 - 4, 2.4);
}

/* ---------------------------- Export ---------------------------- */

/** Pictures as data urls (fetched beforehand: a failing one becomes a beige block, not a failed export). */
async function loadImages(deck: Deck) {
  const urls = new Set<string>();
  for (const { slide } of deck.entries) {
    if (slide.layout === "section" && slide.image)
      urls.add(picture(slide.image));
    if (slide.layout === "markdown" && slide.image)
      urls.add(picture(slide.image, 1200));
  }
  const images = new Map<string, string>();
  await Promise.all(
    [...urls].map(async (url) => {
      try {
        const blob = await (await fetch(url)).blob();
        const data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(blob);
        });
        images.set(url, data);
      } catch {
        /* left out */
      }
    }),
  );
  return images;
}

/** Builds the PowerPoint of a presentation (native shapes and text boxes). */
export async function buildPptx(
  presentation: Presentation,
  captures?: Captures,
) {
  const { default: Pptx } = await import("pptxgenjs");
  const deck = buildDeck(presentation);
  const pptx = new Pptx();
  pptx.layout = "LAYOUT_WIDE";
  pptx.title = presentation.title;
  if (presentation.author) pptx.author = presentation.author;
  const images = await loadImages(deck);

  deck.entries.forEach(({ slide }, index) => {
    const s = pptx.addSlide();
    const capture = captures?.get(index);
    s.background = { color: C.white };
    // flowers (cover, subsections): transparent picture over the whole slide, under the shapes
    if (capture?.toile)
      s.addImage({
        data: imageData(capture.toile.data),
        x: 0,
        y: 0,
        w: W,
        h: u(H),
      });
    const c: Ctx = { pptx, s, deck, index, images, capture };
    (LAYOUTS[slide.layout] as (c: Ctx, slide: Slide) => void)(c, slide);
    const withChrome = ![
      "cover",
      "plan",
      "section",
      "subsection",
      "quote",
    ].includes(slide.layout);
    if (withChrome) chrome(c, slide.title);
    if (slide.layout !== "cover" || index > 0) pageNumber(c);
  });

  return pptx;
}

/** Builds the .pptx of a presentation and downloads it. */
export async function exportPptx(
  presentation: Presentation,
  captures?: Captures,
) {
  const pptx = await buildPptx(presentation, captures);
  await pptx.writeFile({ fileName: `${presentation.name}.pptx` });
}

/** exportPptx with progress / error toasts (buttons of the player and the print view). */
export function downloadPptx(presentation: Presentation, captures?: Captures) {
  return toast.promise(exportPptx(presentation, captures), {
    loading: "Building the PowerPoint…",
    success: "PowerPoint downloaded",
    error: (error) => ({
      message: "PowerPoint export failed",
      description: error instanceof Error ? error.message : String(error),
    }),
  });
}

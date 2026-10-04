import {
  BarChart3Icon,
  LineChartIcon,
  MessageCircleQuestionIcon,
  TableIcon,
} from "lucide-react";
import type { CompareSlide } from "@/features/presentation/layouts/compare";
import type { VisualSlide } from "@/features/presentation/layouts/visual";
import { BRAND } from "@/lib/app-config";
import { type Crop, definePresentation, type Point, type Slide } from "./types";

/* ------------------------------------------------------------------ */
/* Report: pages and visuals                                           */
/* ------------------------------------------------------------------ */

const REPORT =
  "https://app.powerbi.com/reportEmbed?reportId=2066ecc8-ead6-425b-a465-2475384528f1&autoAuth=true&ctid=cf569269-6b46-48af-a6cf-0150f0aa8b7d&navContentPaneEnabled=false&filterPaneEnabled=false";
/** Report pages (Power BI "pageName"). */
const OVERVIEW = `${REPORT}&pageName=ReportSection`;
const DETAIL = `${REPORT}&pageName=ReportSection9380eec50a2a0165bb4b`;

/**
 * Visual positions in page px (1280×720), measured on the report (+8 px margin).
 * The Detail page is 960×540 in Power BI: its values are scaled ×4/3. Recalibrate with key C.
 */
const V1 = {
  filter: { x: 1015, y: 0, w: 222, h: 83 },
  cards: { x: 40, y: 84, w: 473, h: 107 },
  trend: { x: 527, y: 84, w: 710, h: 255 },
  breakdown: { x: 40, y: 208, w: 472, h: 184 },
  stages: { x: 40, y: 384, w: 472, h: 312 },
  detail: { x: 528, y: 360, w: 272, h: 336 },
} satisfies Record<string, Crop>;
const V2 = {
  title: { x: 40, y: 0, w: 470, h: 80 },
  table: { x: 55, y: 79, w: 1171, h: 611 },
  back: { x: 1205, y: 0, w: 75, h: 60 },
} satisfies Record<string, Crop>;

/** Pictures (Unsplash, free licence). Replace with your own urls or files in /public. */
const PICTURES = {
  alcove: "https://images.unsplash.com/photo-1786521875230-406eca1e2b73",
  stairs: "https://images.unsplash.com/photo-1601993957728-1e56ab70c5a8",
  palm: "https://images.unsplash.com/photo-1592262602325-a89eca9a4616",
  shadows: "https://images.unsplash.com/photo-1521194263619-39ecc5b55c61",
  concrete: "https://images.unsplash.com/photo-1606208594041-3dfd470247ce",
  stone: "https://images.unsplash.com/photo-1603369425250-b276f2006ec0",
};

/* ------------------------------------------------------------------ */
/* Placeholder copy (Lorem ipsum): replace with the real text          */
/* ------------------------------------------------------------------ */

const LOREM = [
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
  "Duis aute irure dolor in reprehenderit in voluptate velit esse.",
  "Excepteur sint occaecat cupidatat non proident, sunt in culpa.",
  "Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit.",
  "Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet.",
  "Quis autem vel eum iure reprehenderit qui in ea voluptate velit.",
];
/** A sentence of Lorem ipsum (varies with `n`). */
const lorem = (n = 0) => LOREM[n % LOREM.length];
/** A lead sentence with a **bold** and a ==gold== highlight. */
const leadText = (n = 0) =>
  [
    "Lorem ipsum **dolor sit amet**, consectetur ==adipiscing elit==.",
    "Sed do **eiusmod tempor** incididunt ut ==labore et dolore==.",
    "Ut enim ad **minim veniam**, quis nostrud ==exercitation ullamco==.",
  ][n % 3];
/** Numbered points: title + Lorem ipsum text. */
const points = (titles: string[], offset = 0): Point[] =>
  titles.map((title, i) => ({ title, text: lorem(i + offset) }));
const recap = (title: string) => `## Lorem ipsum

Lorem ipsum dolor sit amet, **${title}** consectetur adipiscing elit, sed do ==eiusmod tempor== incididunt ut labore et dolore magna aliqua.

- Ut enim ad minim veniam
- Quis nostrud exercitation ullamco
- Duis aute irure dolor in reprehenderit
- Excepteur sint occaecat cupidatat`;

/* ------------------------------------------------------------------ */
/* One part per report page, always with the same structure            */
/* ------------------------------------------------------------------ */

type Visual = Omit<VisualSlide, "layout">;

type ReportPage = {
  title: string;
  image: string;
  /** Report url showing this page. */
  report: string;
  kpis: { title: string; text: string }[];
  attention: { lead: string; points: Point[] };
  filters: Visual;
  /** Three visuals of the page, explained one by one. */
  visuals: [Visual, Visual, Visual];
  compare: Omit<CompareSlide, "layout">;
  /** Three use cases, on the whole page. */
  useCases: [Visual, Visual, Visual];
  /** Markdown recap of the page. */
  recap: string;
};

const reportPageSlides = (page: ReportPage): Slide[] => {
  const visual = (v: Visual): Slide => ({
    layout: "visual",
    report: page.report,
    ...v,
  });
  return [
    { layout: "section", title: page.title, image: page.image },
    {
      layout: "subsection",
      title: "Lorem",
      description:
        "Lorem ipsum **dolor sit amet**, consectetur adipiscing elit, sed do ==eiusmod tempor== incididunt.",
    },
    {
      layout: "cards",
      title: "Lorem ipsum",
      lead: leadText(0),
      items: page.kpis,
    },
    { layout: "list", title: "Dolor sit amet", ...page.attention },
    visual(page.filters),
    {
      layout: "subsection",
      title: "Ipsum",
      description:
        "Ut enim ad **minim veniam**, quis nostrud exercitation ==ullamco laboris== nisi ut aliquip.",
    },
    // The whole page, not cropped, on the full width (scrollable)
    {
      layout: "report",
      title: "Lorem ipsum",
      lead: leadText(2),
      report: page.report,
    },
    ...page.visuals.map(visual),
    { layout: "compare", ...page.compare },
    {
      layout: "subsection",
      title: "Dolor",
      description:
        "Duis aute **irure dolor** in reprehenderit in ==voluptate velit== esse cillum dolore.",
    },
    ...page.useCases.map(visual),
    {
      layout: "markdown",
      title: `Lorem — ${page.title}`,
      lead: leadText(1),
      markdown: page.recap,
    },
  ];
};

/* ---------------------------- Page A ---------------------------- */

const overview = (title: string, image: string): ReportPage => ({
  title,
  image,
  report: OVERVIEW,
  kpis: ["Lorem", "Ipsum", "Dolor", "Amet", "Tempor", "Magna"].map((t, i) => ({
    title: t,
    text: lorem(i),
  })),
  attention: {
    lead: leadText(1),
    points: [
      ...points(["Lorem ipsum", "Dolor sit"]),
      {
        title: "Amet consectetur",
        text: lorem(2),
        items: ["Lorem ipsum dolor sit amet"],
      },
      ...points(["Adipiscing elit", "Sed eiusmod"], 3),
    ],
  },
  filters: {
    title: "Consectetur",
    lead: leadText(2),
    points: points(["Tempor incididunt", "Labore dolore", "Magna aliqua"], 1),
    crop: V1.filter,
  },
  visuals: [
    {
      title: "Lorem ipsum dolor",
      lead: leadText(0),
      points: [
        {
          title: "Lorem ipsum",
          text: lorem(0),
          items: ["Lorem ipsum dolor", "Sit amet consectetur"],
        },
        { title: "Dolor sit", text: lorem(1) },
      ],
      crop: V1.cards,
    },
    {
      title: "Sit amet consectetur",
      lead: leadText(1),
      points: [
        {
          title: "Adipiscing",
          text: lorem(2),
          items: ["Lorem ipsum", "Dolor sit amet"],
        },
        ...points(["Eiusmod tempor", "Incididunt"], 3),
      ],
      crop: V1.trend,
    },
    {
      title: "Adipiscing elit sed",
      lead: leadText(2),
      points: [
        { title: "Labore dolore", text: lorem(4) },
        { title: "Magna aliqua", text: lorem(5), warning: true },
      ],
      crop: V1.stages,
    },
  ],
  compare: {
    title: "Lorem / ipsum",
    lead: leadText(0),
    points: [
      {
        title: "Lorem",
        text: lorem(6),
        items: ["Lorem ipsum dolor", "Sit amet consectetur"],
      },
      { title: "Ipsum", text: lorem(7), items: ["Adipiscing elit sed do"] },
    ],
    before: { report: DETAIL, label: "Lorem" },
    after: { report: OVERVIEW, label: "Ipsum" },
  },
  useCases: [
    {
      title: "Lorem — ipsum dolor",
      lead: leadText(1),
      points: points(["Ut enim minim", "Quis nostrud", "Ullamco laboris"]),
    },
    {
      title: "Lorem — sit amet",
      lead: leadText(2),
      points: points(["Duis aute", "Irure dolor", "Velit esse"], 3),
    },
    {
      title: "Lorem — consectetur",
      lead: leadText(0),
      points: points(["Excepteur sint", "Occaecat", "Cupidatat"], 5),
    },
  ],
  recap: recap(title),
});

/* ---------------------------- Page B ---------------------------- */

const detail: ReportPage = {
  title: "Dolor Sit",
  image: PICTURES.shadows,
  report: DETAIL,
  kpis: ["Labore", "Minim", "Veniam", "Aliqua", "Nostrud", "Ullamco"].map(
    (t, i) => ({ title: t, text: lorem(i + 2) }),
  ),
  attention: {
    lead: leadText(2),
    points: [
      { title: "Lorem ipsum", text: lorem(0), warning: true },
      { title: "Dolor sit", text: lorem(1) },
      { title: "Amet", text: lorem(2), warning: true },
      { title: "Consectetur", text: lorem(3) },
    ],
  },
  filters: {
    title: "Consectetur",
    lead: leadText(0),
    points: points(["Lorem ipsum", "Dolor sit"], 4),
    crop: V1.filter,
    report: OVERVIEW,
  },
  visuals: [
    {
      title: "Lorem ipsum",
      lead: leadText(1),
      points: points(["Dolor sit"], 2),
      crop: V2.title,
    },
    {
      title: "Dolor sit amet",
      lead: leadText(2),
      points: [
        { title: "Lorem", items: ["Lorem ipsum", "Dolor sit", "Amet"] },
        {
          title: "Ipsum",
          items: ["Consectetur", "Adipiscing", "Elit sed", "Eiusmod"],
        },
        { title: "Dolor", text: lorem(3) },
      ],
      crop: V2.table,
    },
    {
      title: "Consectetur adipiscing",
      lead: leadText(0),
      points: points(["Tempor"], 4),
      crop: V2.back,
    },
  ],
  compare: {
    title: "Lorem / ipsum",
    lead: leadText(1),
    points: points(["Lorem", "Ipsum"], 5),
    before: { report: OVERVIEW, crop: V1.detail, label: "Lorem" },
    after: {
      report: DETAIL,
      crop: { x: 55, y: 79, w: 490, h: 605 },
      label: "Ipsum",
    },
  },
  useCases: [
    {
      title: "Dolor — lorem ipsum",
      lead: leadText(2),
      points: points(["Ut enim minim", "Quis nostrud", "Ullamco laboris"]),
    },
    {
      title: "Dolor — sit amet",
      lead: leadText(0),
      points: points(["Duis aute", "Irure dolor", "Velit esse"], 3),
    },
    {
      title: "Dolor — consectetur",
      lead: leadText(1),
      points: points(["Excepteur sint", "Occaecat", "Cupidatat"], 6),
    },
  ],
  recap: recap("Dolor Sit"),
};

/* ------------------------------------------------------------------ */

export const guide = definePresentation({
  name: "guide",
  title: "Lorem ipsum dolor sit amet",
  subtitle: "Consectetur adipiscing elit, sed do eiusmod tempor incididunt",
  author: "Lorem Ipsum",
  date: "Dolor 2026",
  context: "Lorem · Ipsum dolor",
  brand: BRAND,
  reportUrl: OVERVIEW,
  slides: [
    {
      layout: "cover",
      title: "Lorem ipsum dolor sit amet",
      subtitle: "Consectetur adipiscing elit, sed do eiusmod tempor incididunt",
    },
    { layout: "plan", title: "Lorem ipsum" },

    /* 1 — Introduction */
    { layout: "section", title: "Lorem", image: PICTURES.alcove },
    {
      layout: "quote",
      title: "Ipsum",
      text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.",
      author: "Lorem Ipsum",
    },
    {
      layout: "markdown",
      title: "Dolor sit",
      lead: leadText(0),
      image: PICTURES.stairs,
      markdown: `## Lorem ipsum dolor

Lorem ipsum dolor sit amet, consectetur adipiscing elit : ==sed do eiusmod tempor incididunt== ut labore et dolore magna aliqua.

Ut enim ad minim veniam, quis nostrud **exercitation ullamco** laboris nisi ut aliquip ex ea commodo consequat.

- Duis aute irure dolor
- In reprehenderit in voluptate velit
- Excepteur sint occaecat cupidatat`,
    },
    {
      layout: "rectangles",
      title: "Amet consectetur",
      lead: leadText(1),
      items: [
        {
          title: "Lorem Ipsum",
          icon: BarChart3Icon,
          text: "Lorem **ipsum dolor** sit amet.\n\n### Lorem ipsum\n\n- Consectetur adipiscing\n- Sed do eiusmod",
        },
        {
          title: "Dolor Sit",
          icon: TableIcon,
          text: "Ut enim **ad minim** veniam.\n\n### Lorem ipsum\n\n- Quis nostrud\n- Exercitation ullamco",
        },
        {
          title: "Amet Consectetur",
          icon: LineChartIcon,
          text: "Duis aute **irure dolor**.\n\n### Lorem ipsum\n\n- In reprehenderit\n- Voluptate velit",
        },
      ],
    },
    {
      layout: "list",
      title: "Adipiscing elit",
      lead: leadText(2),
      points: [
        ...points([
          "Lorem ipsum",
          "Dolor sit",
          "Amet consectetur",
          "Adipiscing",
          "Sed eiusmod",
        ]),
        {
          title: "Tempor",
          text: lorem(5),
          items: ["Lorem ipsum dolor sit amet"],
        },
        ...points(["Incididunt", "Labore dolore"], 6),
      ],
    },

    /* 2 — Page A, 3 — Page B, 4 — Page C */
    ...reportPageSlides(overview("Lorem Ipsum", PICTURES.palm)),
    ...reportPageSlides(detail),
    // Page C: same content as page A for now (replace with the real page when it exists).
    ...reportPageSlides(overview("Amet Consectetur", PICTURES.concrete)),

    /* 5 — Conclusion */
    { layout: "section", title: "Magna", image: PICTURES.stone },
    {
      layout: "list",
      title: "Lorem ipsum",
      lead: leadText(0),
      points: points(["Lorem ipsum", "Dolor sit", "Amet", "Consectetur"], 2),
    },
    {
      layout: "faq",
      title: "Dolor sit",
      // lead with its own icon and colour (default: chart icon, gold)
      lead: {
        text: leadText(1),
        icon: MessageCircleQuestionIcon,
        color: "#2E5AAC",
      },
      items: [0, 1, 2, 3, 4, 5].map((i) => ({
        q: `${["Lorem ipsum dolor", "Sed do eiusmod", "Ut enim ad minim", "Duis aute irure", "Excepteur sint", "Nemo enim ipsam"][i]} sit amet?`,
        a: `${lorem(i + 1)} **Consectetur adipiscing** elit.`,
      })),
    },
    {
      layout: "cover",
      eyebrow: "Lorem",
      title: "Ipsum dolor?",
      subtitle: "Lorem ipsum dolor sit amet, consectetur adipiscing elit",
    },
  ],
});

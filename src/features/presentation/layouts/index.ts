import { type CardsSlide, cards } from "./cards";
import { type CompareSlide, compare } from "./compare";
import { type CoverSlide, cover } from "./cover";
import type { LayoutDef } from "./define";
import { type FaqSlide, faq } from "./faq";
import { type ListSlide, list } from "./list";
import { type MarkdownSlide, markdown } from "./markdown";
import { type PlanSlide, plan } from "./plan";
import { type QuoteSlide, quote } from "./quote";
import { type RectanglesSlide, rectangles } from "./rectangles";
import { type ReportSlide, report } from "./report";
import { type SectionSlide, section } from "./section";
import { type SubsectionSlide, subsection } from "./subsection";
import { type VisualSlide, visual } from "./visual";

/** Every slide a presentation can contain: `layout` picks the layout, the rest are its params. */
export type Slide =
  | CoverSlide
  | PlanSlide
  | SectionSlide
  | SubsectionSlide
  | QuoteSlide
  | MarkdownSlide
  | RectanglesSlide
  | CardsSlide
  | ListSlide
  | VisualSlide
  | CompareSlide
  | ReportSlide
  | FaqSlide;

type Registry = {
  [K in Slide["layout"]]: LayoutDef<Extract<Slide, { layout: K }>>;
};

export const LAYOUTS: Registry = {
  cover,
  plan,
  section,
  subsection,
  quote,
  markdown,
  rectangles,
  cards,
  list,
  visual,
  compare,
  report,
  faq,
};

/** Layout of a slide, typed for any slide. */
export const layoutOf = (slide: Slide) =>
  LAYOUTS[slide.layout] as LayoutDef<Slide>;

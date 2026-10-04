import type { LucideIcon } from "lucide-react";
import type { Slide } from "@/features/presentation/layouts";

export type { Slide };

/** Reference size of a Power BI page (16:9). Crops are expressed in these "page px". */
export const PAGE = { w: 1280, h: 720 };
export type PageSize = typeof PAGE;

/** Zone of the report page in "page px" (reference PAGE), independent of the screen size. */
export type Crop = { x: number; y: number; w: number; h: number };

/** A point of a list: title, explanation, optional sub-points. Text supports **bold**, *italic* and ==gold==. */
export type Point =
  | string
  | {
      title: string;
      text?: string;
      items?: string[];
      icon?: LucideIcon;
      warning?: boolean;
    };

/** One side of a before / after comparison. */
export type CompareSide = {
  /** Report url (e.g. with "&pageName=…"); defaults to the presentation's reportUrl. */
  report?: string;
  /** Zone in page px; defaults to the whole page. */
  crop?: Crop;
  /** Label shown on the frame (e.g. "Before", "After — v2"). */
  label?: string;
};

/**
 * A presentation is a flat list of slides, each with its layout (see features/presentation/layouts).
 * `section` and `subsection` slides give the structure: plan, breadcrumb and side outline derive from them.
 */
export type Presentation = {
  /** Used in the url: /presentation?name=<name> */
  name: string;
  title: string;
  subtitle?: string;
  author?: string;
  date?: string;
  /** Context line shown on the cover (e.g. "Reporting · Planning"). */
  context?: string;
  /** Name next to the logo (header of the slides). */
  brand?: string;
  /**
   * Power BI report embed url, e.g.
   * https://app.powerbi.com/reportEmbed?reportId=<id>&autoAuth=true&ctid=<tenant>&pageName=<page>&navContentPaneEnabled=false&filterPaneEnabled=false
   * Empty = a mock report is shown (handy to design the slides).
   */
  reportUrl?: string;
  /** Size of the report page if it is not 1280×720. */
  page?: PageSize;
  slides: Slide[];
};

/** Identity helper giving autocompletion when declaring a presentation. */
export const definePresentation = (presentation: Presentation) => presentation;

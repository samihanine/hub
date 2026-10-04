import type { LucideIcon } from "lucide-react";
import {
  BarChart3Icon,
  FolderOpenIcon,
  ListChecksIcon,
  PencilLineIcon,
  PresentationIcon,
  SparklesIcon,
  UsersIcon,
} from "lucide-react";

/** App name (presentation wordmark, tab title). */
export const BRAND = "Lorem";

/**
 * Brand mark drawn (animated) in the presentations: the whole word as the logo of the header and
 * covers, its first letter alone on the slides ("Acme" → "A").
 */
export const BRAND_MARK = "Lorem";

/**
 * Optional hand-tuned geometry of the whole mark (svg viewBox width and outline length, for a
 * font size of 84): null = measured automatically from the rendered text.
 */
export const BRAND_MARK_SIZE: { width: number; length: number } | null = null;

/**
 * Admin emails (case-insensitive): they see the `adminOnly` shortcuts and can be used as table
 * `writers`. Outside the Power Apps host (`npm run dev` in a plain browser) the app runs as the
 * first one, to test the admin views and role=write locally.
 */
export const ADMINS: readonly string[] = [
  "sami@otopio.ca",
  "sami@megascale.onmicrosoft.com",
];

/**
 * Power Apps features: table pages, Excel / SharePoint connectors, current user. false = a standalone
 * app (home and presentations only; table pages and their shortcuts disappear).
 * The single-file HTML export (`npm run build:html`) always builds with false.
 */
const POWER_APPS_ENABLED = true;
export const POWER_APPS =
  POWER_APPS_ENABLED && import.meta.env.VITE_STANDALONE !== "true";

/** true = demo mode (rows kept in the browser) even when the Excel connector is added. */
export const FORCE_DEMO = false;

export const HOME = {
  eyebrow: "Reporting hub",
  title: "Home",
};

/** Muted tones for the shortcut icons. */
export const SHORTCUT_COLORS = [
  "#B08D57",
  "#6F8466",
  "#B4694A",
  "#5B6B86",
  "#86607A",
  "#4F8079",
] as const;

export type Shortcut = {
  title: string;
  icon: LucideIcon;
  /** Icon tone (hex). Defaults to a palette. */
  color?: string;
  /** "/…" = app page (e.g. "/tables?name=task&role=read"), otherwise external link (new tab). */
  href: string;
  /** Only shown to the ADMINS. */
  adminOnly?: boolean;
};

/** Home shortcuts, grouped. Add / remove entries here. */
export const SHORTCUT_GROUPS: { title: string; items: Shortcut[] }[] = [
  {
    title: "Guides & presentations",
    items: [
      {
        title: "Presentation guide",
        icon: PresentationIcon,
        href: "/presentation?name=guide",
      },
      {
        title: "Power BI report",
        icon: BarChart3Icon,
        href: "https://app.powerbi.com/groups/me/reports/2066ecc8-ead6-425b-a465-2475384528f1/ReportSection",
      },
    ],
  },
  {
    title: "Tables",
    items: [
      {
        title: "Tasks",
        icon: ListChecksIcon,
        href: "/tables?name=task&role=read",
      },
      {
        title: "Tasks — edit",
        icon: PencilLineIcon,
        href: "/tables?name=task&role=write",
        adminOnly: true,
      },
    ],
  },
  {
    title: "Useful links",
    items: [
      {
        title: "SharePoint documents",
        icon: FolderOpenIcon,
        href: "https://www.office.com/launch/sharepoint",
      },
      {
        title: "Teams channel",
        icon: UsersIcon,
        href: "https://teams.microsoft.com/",
      },
      {
        title: "What's new",
        icon: SparklesIcon,
        href: "/tables?name=task&role=read",
      },
    ],
  },
];

import { cn } from "@/lib/utils";
import { CONTENT, type Lead, LeadBand, Page } from "../ui";
import { defineLayout } from "./define";

/**
 * The lead band, then a whole report page (not cropped) on the full width, at its own ratio:
 * scroll to see the bottom of the page. The report stays interactive. It is drawn by the player's
 * persistent ReportStage (same iframe as the visual slides: signed in once).
 */
export type ReportSlide = {
  layout: "report";
  title: string;
  lead: Lead;
  /** Report url, e.g. with "&pageName=…" (defaults to the presentation's reportUrl). */
  report?: string;
};

export const report = defineLayout<ReportSlide>({
  chrome: true,
  Component: ({ slide }) => (
    <Page className={cn(CONTENT, "flex flex-col")}>
      <LeadBand lead={slide.lead} />
    </Page>
  ),
});

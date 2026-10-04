import type { CompareSide, Point } from "@/presentations/types";
import type { Lead } from "../ui";
import { defineLayout } from "./define";
import { ExplanationPanel } from "./visual";

/**
 * Before / after: two report pages (or zones) stacked in the report frame, with a slider between
 * them (drawn by the player's CompareStage). Same composition as a visual slide.
 */
export type CompareSlide = {
  layout: "compare";
  title: string;
  lead: Lead;
  points?: Point[];
  before: CompareSide;
  after: CompareSide;
};

export const compare = defineLayout<CompareSlide>({
  chrome: true,
  Component: ({ slide }) => (
    <ExplanationPanel lead={slide.lead} points={slide.points} />
  ),
});

import type { Presentation, Slide } from "@/presentations/types";

/** House gold, the accent of every slide. */
export const GOLD = "#B08D57";

export type DeckSubsection = { title: string; slide: number; slides: number[] };
export type DeckSection = {
  title: string;
  slide: number;
  slides: number[];
  subsections: DeckSubsection[];
};

/** Position of a slide in the structure (-1 = before the first section / outside a subsection). */
export type DeckEntry = {
  slide: Slide;
  index: number;
  section: number;
  subsection: number;
};

export type Deck = {
  presentation: Presentation;
  entries: DeckEntry[];
  /** Slides before the first section (cover, plan…). */
  intro: number[];
  sections: DeckSection[];
};

/** Derives the structure (sections → optional subsections → slides) from the flat slide list. */
export function buildDeck(presentation: Presentation): Deck {
  const sections: DeckSection[] = [];
  const intro: number[] = [];
  const entries = presentation.slides.map((slide, index): DeckEntry => {
    if (slide.layout === "section")
      sections.push({
        title: slide.title,
        slide: index,
        slides: [],
        subsections: [],
      });
    const section = sections.at(-1);
    if (slide.layout === "subsection" && section)
      section.subsections.push({
        title: slide.title,
        slide: index,
        slides: [],
      });
    const subsection =
      slide.layout === "section" ? undefined : section?.subsections.at(-1);

    if (!section) intro.push(index);
    else if (slide.layout !== "section" && slide.layout !== "subsection")
      (subsection ?? section).slides.push(index);

    return {
      slide,
      index,
      section: sections.length - 1,
      subsection: section ? section.subsections.length - 1 : -1,
    };
  });
  return { presentation, entries, intro, sections };
}

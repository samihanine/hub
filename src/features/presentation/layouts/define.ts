import type { Deck } from "../deck";

/** What every layout receives besides its slide. */
export type LayoutContext = {
  deck: Deck;
  /** Index of the slide in the presentation. */
  index: number;
  /** Go to a slide (plan, restart…). */
  go: (index: number) => void;
  /**
   * Number of items revealed so far on slides that reveal step by step (see `steps`):
   * one more on each click / key press. Infinity = everything (PDF export).
   */
  step: number;
};

export type LayoutDef<S> = {
  /** Header (logo + slide title) and page number drawn around the slide. */
  chrome: boolean;
  Component: (props: { slide: S } & LayoutContext) => React.ReactNode;
  /** Items revealed one by one on click / key press before moving to the next slide (default 0). */
  steps?: (slide: S, deck: Deck) => number;
};

/** A layout = its visual (Component) + whether it uses the shared header. Its params are its slide type. */
export const defineLayout = <S>(def: LayoutDef<S>) => def;

import { guide } from "./guide";
import type { Presentation } from "./types";

/** Every presentation available at /presentation?name=<name>. Add yours here. */
export const PRESENTATIONS: Presentation[] = [guide];

export const findPresentation = (name: string | undefined) =>
  PRESENTATIONS.find((p) => p.name === name);

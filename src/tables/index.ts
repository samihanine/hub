import type { TableDef } from "./schema";
import { taskTable } from "./task";

/** Every table available at /tables?name=<name>. Add yours here. */
export const TABLES: readonly TableDef[] = [taskTable];

export const findTable = (name: string | undefined) =>
  TABLES.find((t) => t.name === name);

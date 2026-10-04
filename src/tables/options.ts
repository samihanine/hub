import type { Option } from "./schema";

/** Option lists shared by several tables. */
export const STATUS = [
  { value: "to_do", label: "To do", color: "gray" },
  { value: "in_progress", label: "In progress", color: "blue" },
  { value: "to_validate", label: "To validate", color: "yellow" },
  { value: "done", label: "Done", color: "green" },
  { value: "canceled", label: "Canceled", color: "red" },
] as const satisfies readonly Option[];

export const PRIORITY = [
  { value: "low", label: "Low", color: "gray" },
  { value: "medium", label: "Medium", color: "orange" },
  { value: "high", label: "High", color: "red" },
] as const satisfies readonly Option[];

export const TEAMS = [
  { value: "data", label: "Data", color: "teal" },
  { value: "finance", label: "Finance", color: "indigo" },
  { value: "ops", label: "Operations", color: "violet" },
  { value: "rh", label: "HR", color: "pink" },
] as const satisfies readonly Option[];

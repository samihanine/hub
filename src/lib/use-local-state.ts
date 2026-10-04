import { useCallback, useEffect, useState } from "react";

const read = <T>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(key);
    return saved === null ? fallback : (JSON.parse(saved) as T);
  } catch {
    return fallback;
  }
};

/** useState persisted in localStorage (per browser). */
export function useLocalState<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => read(key, fallback));

  // Another key (e.g. another table): reload its value.
  // biome-ignore lint/correctness/useExhaustiveDependencies: only a new key reloads (fallback is a default value)
  useEffect(() => setValue(read(key, fallback)), [key]);

  const set = useCallback(
    (next: T | ((previous: T) => T)) =>
      setValue((previous) => {
        const value =
          typeof next === "function" ? (next as (p: T) => T)(previous) : next;
        try {
          localStorage.setItem(key, JSON.stringify(value));
        } catch {
          /* storage full or blocked: keep the in-memory value */
        }
        return value;
      }),
    [key],
  );
  return [value, set] as const;
}

import { getContext, type IContext } from "@microsoft/power-apps/app";
import { getClient } from "@microsoft/power-apps/data";
import { useQuery } from "@tanstack/react-query";
import { ADMINS, FORCE_DEMO, POWER_APPS } from "@/lib/app-config";

/* ------------------------------------------------------------------ */
/* Connected data sources                                              */
/* ------------------------------------------------------------------ */

type DataSourcesInfo = Parameters<typeof getClient>[0];

/**
 * `pa app add data-source` generates this file. Globbing it (instead of importing it) keeps the app
 * compiling before any data source is added: the app then runs in demo mode.
 */
const generated = import.meta.glob<{ dataSourcesInfo: DataSourcesInfo }>(
  [
    "/.power/schemas/appschemas/dataSourcesInfo.ts",
    "/src/generated/**/dataSourcesInfo.ts",
  ],
  { eager: true },
);
const dataSourcesInfo: DataSourcesInfo = Object.assign(
  {},
  ...Object.values(generated).map((m) => m.dataSourcesInfo),
);

/** Key of a connector in dataSourcesInfo ("excelonlinebusiness", "sharepointonline"…). */
const findSource = (connector: string) =>
  Object.keys(dataSourcesInfo).find((key) =>
    key.toLowerCase().includes(connector),
  );

export const EXCEL_SOURCE = findSource("excelonline");
export const SHAREPOINT_SOURCE = findSource("sharepoint");

/** "connector" once the Excel connector has been added with `npm run pa:add-excel`. */
export const DATA_MODE: "connector" | "demo" =
  FORCE_DEMO || !EXCEL_SOURCE ? "demo" : "connector";

let client: ReturnType<typeof getClient> | undefined;

/** Calls a connector operation (operation ids are those of the connector's swagger). */
export async function callConnector<T>(
  source: string,
  operationName: string,
  parameters: Record<string, unknown>,
) {
  client ??= getClient(dataSourcesInfo);
  const result = (await client.executeAsync({
    connectorOperation: { tableName: source, operationName, parameters },
  })) as { success?: boolean; data?: T; error?: unknown };
  if (result.success === false || result.error)
    throw toError(result.error, operationName);
  return result.data as T;
}

/** The SDK unwraps OData responses ({ value: [...] } → [...]): accept both shapes. */
export const asList = <T>(data: unknown): T[] =>
  Array.isArray(data)
    ? (data as T[])
    : ((data as { value?: T[] } | null)?.value ?? []);

function toError(error: unknown, operation: string) {
  if (error instanceof Error) return error;
  const message =
    typeof error === "object" && error && "message" in error
      ? String(error.message)
      : JSON.stringify(error);
  return new Error(`${operation}: ${message || "unknown error"}`);
}

/* ------------------------------------------------------------------ */
/* Current user                                                        */
/* ------------------------------------------------------------------ */

const withTimeout = <T>(promise: Promise<T>, ms: number) =>
  Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), ms),
    ),
  ]);

/** Power Apps context, or null outside the Power Apps host (plain `vite` in a browser). */
export const loadContext = () =>
  withTimeout(getContext(), 4000).catch((): IContext | null => null);

export type CurrentUser = { name: string; email: string; local: boolean };

export function useCurrentUser() {
  return useQuery({
    queryKey: ["power-context"],
    staleTime: Infinity,
    queryFn: async (): Promise<CurrentUser> => {
      // Standalone app: no Power Apps host, no identity.
      if (!POWER_APPS) return { name: "Guest", email: "", local: true };
      const context = await loadContext();
      if (context?.user.userPrincipalName)
        return {
          name: context.user.fullName ?? context.user.userPrincipalName,
          email: context.user.userPrincipalName,
          local: false,
        };
      // Outside Power Apps: the first admin (to test the admin views and role=write locally).
      const email = DEV_USER;
      return { name: email.split("@")[0] || "Guest", email, local: true };
    },
  });
}

/** Identity used outside the Power Apps host. */
export const DEV_USER = ADMINS[0] ?? "";

export const isAdmin = (email: string | undefined) =>
  !!email && ADMINS.some((a) => a.toLowerCase() === email.toLowerCase());

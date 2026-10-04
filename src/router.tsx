import {
  createHashHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { z } from "zod";
import { AppShell } from "@/components/app-shell";
import { NotFound } from "@/components/not-found";
import { HomePage } from "@/features/home/home-page";
import { PresentationPage } from "@/features/presentation/presentation-page";
import { TablesPage } from "@/features/tables/tables-page";
import { POWER_APPS } from "@/lib/app-config";

const rootRoute = createRootRoute({
  component: AppShell,
  notFoundComponent: () => <NotFound />,
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const tablesSearch = z.object({
  name: z.string().optional().catch(undefined),
  role: z.enum(["read", "write"]).default("read").catch("read"),
});
export const tablesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/tables",
  validateSearch: tablesSearch,
  component: TablesPage,
});

const presentationSearch = z.object({
  name: z.string().optional().catch(undefined),
  /** 1-based slide number, kept in the url so a slide can be shared. */
  slide: z.coerce.number().int().min(1).optional().catch(undefined),
  /** Printable view of the whole presentation (export to PDF). */
  print: z.coerce.boolean().optional().catch(undefined),
});
export const presentationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/presentation",
  validateSearch: presentationSearch,
  component: PresentationPage,
});

// Without Power Apps (standalone app, HTML export) there are no table pages.
const routeTree = rootRoute.addChildren(
  POWER_APPS
    ? [homeRoute, tablesRoute, presentationRoute]
    : [homeRoute, presentationRoute],
);

// Hash history: the Power Apps host serves the app from a single url.
export const router = createRouter({
  routeTree,
  history: createHashHistory(),
  defaultPreload: "intent",
  scrollRestoration: true,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

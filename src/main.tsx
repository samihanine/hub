import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "sonner";
import "./index.css";
import { POWER_APPS } from "@/lib/app-config";
import { loadContext } from "@/lib/power-apps";
import { router } from "./router";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 min
      gcTime: 10 * 60 * 1000, // 10 min
    },
    mutations: { retry: false },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster
        position="top-center"
        theme="light"
        toastOptions={{
          classNames: {
            toast: "!rounded-none !border-border !bg-card !font-sans",
            description: "!text-muted-foreground",
          },
        }}
        expand
        duration={3000}
        visibleToasts={3}
      />
    </QueryClientProvider>
  </StrictMode>,
);

/**
 * Deep links from Power Apps: the player passes its own query string to the app
 * (…/play/<appId>?page=tables&name=task&role=write) → open the matching page.
 */
// (only with Power Apps: a standalone app has no host to ask)
if (POWER_APPS)
  void loadContext().then((context) => {
    const { page, ...search } = context?.app.queryParams ?? {};
    if (
      page &&
      ["tables", "presentation"].includes(page) &&
      router.state.location.pathname === "/"
    )
      void router.navigate({
        to: `/${page}` as "/tables",
        search: search as never,
      });
  });

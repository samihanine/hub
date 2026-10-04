import { Outlet } from "@tanstack/react-router";

/** No global header: each page carries its own (small) title and back link. */
export function AppShell() {
  return (
    <main className="flex min-h-full flex-col">
      <Outlet />
    </main>
  );
}

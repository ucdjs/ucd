import { ExplorerBreadcrumbs } from "#components/explorer/file/explorer-breadcrumbs";
import { ExplorerHeader } from "#components/explorer/file/explorer-header";
import { ExplorerSidebar } from "#components/explorer/file/explorer-sidebar";
import { ExplorerToolbar } from "#components/explorer/file/explorer-toolbar";
import { useHotkey } from "@tanstack/react-hotkeys";
import { createFileRoute, Outlet, useChildMatches } from "@tanstack/react-router";
import { toast } from "@ucdjs-internal/shared-ui/components";
import { Suspense, useCallback } from "react";

export const Route = createFileRoute("/(explorer)/file-explorer")({
  head: () => ({
    meta: [
      {
        name: "robots",
        content: "noindex, nofollow",
      },
    ],
  }),
  component: FileExplorerLayout,
});

function FileExplorerLayout() {
  const [currentMatch] = useChildMatches();
  const currentPath = (currentMatch?.params as { _splat?: string } | undefined)?._splat ?? "";
  const isFileRoute = currentMatch?.routeId === "/(explorer)/file-explorer/v/$";
  const copyPath = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      toast.error("Clipboard is not available in this browser.");
      return;
    }

    await navigator.clipboard.writeText(`/${currentPath}`);
    toast.success(currentPath ? "Copied path to clipboard." : "Copied explorer root path.");
  }, [currentPath]);

  useHotkey("Mod+Shift+C", () => {
    void copyPath();
  }, { preventDefault: true });

  return (
    <div className="flex h-svh flex-col bg-background overflow-hidden">
      <ExplorerHeader />
      <main className="flex flex-1 overflow-hidden">
        <aside className="hidden w-72 flex-col border-r bg-background sm:flex overflow-hidden">
          <Suspense fallback={<ExplorerSidebar.Skeleton />}>
            <ExplorerSidebar />
          </Suspense>
        </aside>
        <section className="flex flex-1 flex-col overflow-hidden">
          <div className="border-b bg-background px-4">
            <div className="flex h-12 items-center justify-between gap-4">
              <ExplorerBreadcrumbs />
              {!isFileRoute && <ExplorerToolbar />}
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4 pt-2">
            <Suspense fallback={null}>
              <Outlet />
            </Suspense>
          </div>
        </section>
      </main>
    </div>
  );
}

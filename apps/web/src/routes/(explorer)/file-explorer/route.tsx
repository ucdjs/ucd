import { ExplorerBreadcrumbs } from "#components/file-explorer/explorer-breadcrumbs";
import { ExplorerSidebar } from "#components/file-explorer/explorer-sidebar";
import { ExplorerToolbar } from "#components/file-explorer/explorer-toolbar";
import { createFileRoute, Outlet, useMatch } from "@tanstack/react-router";
import { Suspense } from "react";

export const Route = createFileRoute("/(explorer)/file-explorer")({
  component: FileExplorerLayout,
});

function FileExplorerLayout() {
  const isFileView = useMatch({
    from: "/(explorer)/file-explorer/v/$",
    shouldThrow: false,
  });

  return (
    <div className="flex h-svh flex-col bg-background overflow-hidden">
      <div className="border-b bg-background px-4">
        <div className="flex h-12 items-center justify-between">
          <div className="text-sm font-semibold">File Explorer</div>
        </div>
      </div>
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
              {!isFileView && <ExplorerToolbar />}
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

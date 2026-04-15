import { ReportsExplorerBreadcrumbs } from "#components/reports-explorer/explorer-breadcrumbs";
import { ReportsExplorerHeader } from "#components/reports-explorer/explorer-header";
import { ReportsExplorerSidebar } from "#components/reports-explorer/explorer-sidebar";
import { reportsQueryOptions } from "#functions/reports";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Suspense } from "react";

export const Route = createFileRoute("/(explorer)/reports")({
  loader: ({ context }) => {
    context.queryClient.prefetchQuery(reportsQueryOptions());
  },
  component: ReportsExplorerLayout,
});

function ReportsExplorerLayout() {
  return (
    <div className="flex h-svh flex-col bg-background overflow-hidden">
      <ReportsExplorerHeader />
      <main className="flex flex-1 overflow-hidden">
        <aside className="hidden w-72 flex-col border-r bg-background sm:flex overflow-hidden">
          <Suspense fallback={<ReportsExplorerSidebar.Skeleton />}>
            <ReportsExplorerSidebar />
          </Suspense>
        </aside>
        <section className="flex flex-1 flex-col overflow-hidden">
          <div className="border-b bg-background px-4">
            <div className="flex h-12 items-center justify-between gap-4">
              <ReportsExplorerBreadcrumbs />
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4 pt-2">
            <Outlet />
          </div>
        </section>
      </main>
    </div>
  );
}

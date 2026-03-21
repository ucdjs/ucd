import { InspectSidebar } from "#components/inspect/inspect-sidebar";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/s/$sourceId/$sourceFileId/$pipelineId/inspect")({
  component: InspectLayout,
});

function InspectLayout() {
  return (
    <div className="p-4 sm:p-6">
      <div className="grid gap-6 xl:grid-cols-[22rem_minmax(0,1fr)]">
        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <InspectSidebar />
        </aside>
        <main className="min-w-0 space-y-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

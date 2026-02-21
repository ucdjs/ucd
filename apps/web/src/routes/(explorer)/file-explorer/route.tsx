import { FileExplorerHeader } from "#components/file-explorer/file-explorer-header";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Suspense } from "react";

export const Route = createFileRoute("/(explorer)/file-explorer")({
  component: FileExplorerLayout,
});

function FileExplorerLayout() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <FileExplorerHeader />

      <main className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-auto p-4 pt-2">
          <Suspense fallback={null}>
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  );
}

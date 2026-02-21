import { ExplorerToolbar } from "#components/file-explorer/explorer-toolbar";
import { FileExplorerHeader } from "#components/file-explorer/file-explorer-header";
import { FileTree, FileTreeSkeleton } from "#components/file-explorer/file-tree";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Suspense, useState } from "react";

export const Route = createFileRoute("/(explorer)/file-explorer")({
  component: FileExplorerLayout,
});

function FileExplorerLayout() {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  const handleToggle = (path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleExpandPaths = (paths: string[]) => {
    if (!paths.length) return;
    setExpanded((prev) => {
      const next = new Set(prev);
      paths.forEach((path) => next.add(path));
      return next;
    });
  };

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <div className="border-b bg-background px-4">
        <div className="flex h-12 items-center justify-between">
          <div className="text-sm font-semibold">File Explorer</div>
        </div>
      </div>
      <main className="flex flex-1 overflow-hidden">
        <aside className="hidden w-72 flex-col border-r bg-background sm:flex">
          <Suspense fallback={<FileTreeSkeleton />}>
            <FileTree
              expanded={expanded}
              onToggle={handleToggle}
              onExpandPaths={handleExpandPaths}
            />
          </Suspense>
        </aside>

        <section className="flex flex-1 flex-col overflow-hidden">
          <div className="border-b bg-background px-4">
            <div className="flex h-12 items-center justify-between gap-4">
              <FileExplorerHeader />
              <ExplorerToolbar />
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

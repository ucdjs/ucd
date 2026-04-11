import { ExplorerBreadcrumbs } from "#components/file-explorer/explorer-breadcrumbs";
import { ExplorerSidebar } from "#components/file-explorer/explorer-sidebar";
import { ExplorerToolbar } from "#components/file-explorer/explorer-toolbar";
import { versionsQueryOptions } from "#functions/versions";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, Outlet, useMatch } from "@tanstack/react-router";
import { Button } from "@ucdjs-internal/shared-ui/components";
import { ArrowLeft } from "lucide-react";
import { Suspense } from "react";

export const Route = createFileRoute("/(explorer)/file-explorer")({
  component: FileExplorerLayout,
});

function FileExplorerLayout() {
  const fileMatch = useMatch({
    from: "/(explorer)/file-explorer/v/$",
    shouldThrow: false,
  });
  const directoryMatch = useMatch({
    from: "/(explorer)/file-explorer/$",
    shouldThrow: false,
  });
  const { data: versions } = useQuery(versionsQueryOptions());

  const isFileView = Boolean(fileMatch);
  const currentPath = fileMatch?.params._splat ?? directoryMatch?.params._splat ?? "";
  const versionCandidate = currentPath.split("/").find(Boolean);
  const currentVersion = versions?.some((version) => version.version === versionCandidate)
    ? versionCandidate
    : null;

  return (
    <div className="flex h-svh flex-col bg-background overflow-hidden">
      <div className="border-b bg-background px-4">
        <div className="flex h-12 items-center justify-between gap-4">
          <div className="text-sm font-semibold">File Explorer</div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            nativeButton={false}
            render={currentVersion
              ? (
                  <Link to="/v/$version" params={{ version: currentVersion }}>
                    <ArrowLeft className="size-4" />
                    Back to Unicode
                    {" "}
                    {currentVersion}
                  </Link>
                )
              : (
                  <Link to="/">
                    <ArrowLeft className="size-4" />
                    Back to site
                  </Link>
                )}
          />
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

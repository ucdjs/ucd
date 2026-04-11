/* eslint-disable react-refresh/only-export-components */

import { EntryList } from "#components/file-explorer/entry-list";
import { ExplorerNotFound } from "#components/not-found";
import { directoryListingQueryOptions, getFileHeadInfo } from "#functions/files";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, redirect, retainSearchParams } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { cn } from "@ucdjs-internal/shared-ui";
import { resolveUCDVersion } from "@unicode-utils/core";
import { ArrowUp, FolderUp } from "lucide-react";
import { Suspense } from "react";
import { searchSchema } from "../../../lib/file-explorer";

export const Route = createFileRoute("/(explorer)/file-explorer/$")({
  component: DirectoryExplorerPage,
  validateSearch: zodValidator(searchSchema),
  search: {
    middlewares: [retainSearchParams([
      "query",
      "pattern",
      "sort",
      "order",
      "type",
    ])],
  },
  async beforeLoad({ params, search }) {
    let path = params._splat || "";
    const hasTrailingSlash = path.endsWith("/");
    const pathSegments = path.split("/").filter(Boolean);

    if (pathSegments.length > 0) {
      const version = pathSegments[0] ?? "";
      const rest = pathSegments.slice(1);
      const resolvedVersion = resolveUCDVersion(version);
      if (resolvedVersion !== version) {
        const nextPath = [resolvedVersion, ...rest].join("/");
        throw redirect({
          to: "/file-explorer/$",
          params: { _splat: hasTrailingSlash ? `${nextPath}/` : nextPath },
          search,
        });
      }
      path = hasTrailingSlash ? `${[resolvedVersion, ...rest].join("/")}/` : [resolvedVersion, ...rest].join("/");
    }

    const { statType } = await getFileHeadInfo({ data: { path } });

    if (statType !== "directory") {
      throw redirect({
        to: "/file-explorer/v/$",
        params: { _splat: path },
      });
    }

    return {
      path,
      statType,
    };
  },
  loaderDeps({ search }) {
    return {
      pattern: search.pattern,
      sort: search.sort,
      order: search.order,
      query: search.query,
      type: search.type,
    };
  },
  loader: async ({ context, deps }) => {
    context.queryClient.prefetchQuery(directoryListingQueryOptions({
      path: context.path,
      ...deps,
    }));
  },
  notFoundComponent: DirectoryNotFoundBoundary,
});

function DirectoryExplorerPage() {
  const { _splat: path = "" } = Route.useParams();
  const parentRoutePath = Route.parentRoute.path;

  return (
    <div className="flex flex-col gap-4">
      <div
        className="flex flex-col rounded-lg border border-border overflow-hidden"
      >
        {path && (
          <Link
            to="/file-explorer/$"
            params={{ _splat: parentRoutePath || "" }}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md group",
              "hover:bg-muted/50 transition-colors",
              "border-b border-border/50",
            )}
          >
            <FolderUp className="size-4 text-muted-foreground group-hover:text-primary shrink-0" />
            <span className="flex-1 text-sm text-muted-foreground group-hover:text-primary transition-colors">
              ..
            </span>
            <ArrowUp className="size-3 text-muted-foreground/50" />
          </Link>
        )}
        <Suspense
          fallback={<EntryList.Skeleton />}
        >
          <EntryList
            currentPath={path}
          />
        </Suspense>
      </div>

      <Suspense fallback={null}>
        <DirectorySummary currentPath={path} />
      </Suspense>
    </div>
  );
}

function DirectorySummary({ currentPath }: { currentPath: string }) {
  const search = Route.useSearch();
  const { data } = useSuspenseQuery(directoryListingQueryOptions({
    path: currentPath,
    ...search,
  }));

  if (data.type !== "directory") {
    return null;
  }

  const directories = data.files.filter((entry) => entry.type === "directory").length;
  const files = data.files.length - directories;

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      <span>
        {directories}
        {" "}
        {directories === 1 ? "directory" : "directories"}
      </span>
      <span>•</span>
      <span>
        {files}
        {" "}
        {files === 1 ? "file" : "files"}
      </span>
    </div>
  );
}

function DirectoryNotFoundBoundary() {
  const { _splat } = Route.useParams();

  return <ExplorerNotFound path={_splat ?? ""} />;
}

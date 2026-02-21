import { EntryList } from "#components/file-explorer/entry-list";
import { ExplorerNotFound } from "#components/not-found";
import { filesQueryOptions, getFileHeadInfo } from "#functions/files";
import { createFileRoute, Link, redirect, retainSearchParams, useSearch } from "@tanstack/react-router";
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
    const { statType, amount } = await getFileHeadInfo({ data: {
      path,
      order: search.order,
      pattern: search.pattern,
      sort: search.sort,
      query: search.query,
      type: search.type,
    } });

    if (statType !== "directory") {
      throw redirect({
        to: "/file-explorer/v/$",
        params: { _splat: path },
      });
    }

    return {
      path,
      statType,
      amount,
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
    context.queryClient.prefetchQuery(filesQueryOptions({
      path: context.path,
      pattern: deps.pattern,
      sort: deps.sort,
      order: deps.order,
      query: deps.query,
      type: deps.type,
    }));

    return {
      amount: context.amount,
    };
  },
  notFoundComponent: DirectoryNotFoundBoundary,
});

function DirectoryExplorerPage() {
  const { _splat: path = "" } = Route.useParams();
  const { amount } = Route.useLoaderData();
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
          fallback={(
            <EntryList.Skeleton
              amount={amount}
            />
          )}
        >
          <EntryList
            currentPath={path}
          />
        </Suspense>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>
          {amount.directories}
          {" "}
          {amount.directories === 1 ? "directory" : "directories"}
        </span>
        <span>•</span>
        <span>
          {amount.files}
          {" "}
          {amount.files === 1 ? "file" : "files"}
        </span>
      </div>
    </div>
  );
}

function DirectoryNotFoundBoundary() {
  const { _splat } = Route.useParams();

  return <ExplorerNotFound path={_splat ?? ""} />;
}

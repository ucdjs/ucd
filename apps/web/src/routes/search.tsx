import { searchCharactersQueryOptions } from "#apis/search";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, retainSearchParams, useNavigate, useSearch } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@ucdjs-internal/shared-ui/ui/breadcrumb";
import { Button } from "@ucdjs-internal/shared-ui/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";
import { Input } from "@ucdjs-internal/shared-ui/ui/input";
import { Separator } from "@ucdjs-internal/shared-ui/ui/separator";
import { SidebarTrigger } from "@ucdjs-internal/shared-ui/ui/sidebar";
import { Skeleton } from "@ucdjs-internal/shared-ui/ui/skeleton";
import { Search, X } from "lucide-react";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";

const searchSchema = z.object({
  q: z.string().optional(),
  version: z.string().optional(),
});

export const Route = createFileRoute("/search")({
  component: GlobalSearchPage,
  validateSearch: zodValidator(searchSchema),
  search: {
    middlewares: [retainSearchParams(["q", "version"])],
  },
});

function GlobalSearchPage() {
  const navigate = useNavigate({ from: "/search" });
  const search = useSearch({ from: "/search" });
  const [query, setQuery] = useState(search.q ?? "");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuery(search.q ?? "");
  }, [search.q]);

  const trimmedQuery = query.trim();

  const searchInput = useMemo(() => ({
    query: trimmedQuery,
    version: search.version,
  }), [trimmedQuery, search.version]);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setQuery(value);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      navigate({
        search: (prev) => ({
          ...prev,
          q: value.trim() || undefined,
        }),
      });
    }, 300);
  }, [navigate]);

  const handleClear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setQuery("");
    navigate({
      search: (prev) => ({
        ...prev,
        q: undefined,
      }),
    });
  }, [navigate]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink render={<Link to="/">Home</Link>} />
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Search</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Global Search</h1>
            <p className="text-sm text-muted-foreground">
              Search Unicode names, blocks, scripts, and codepoints. Results are mocked for now.
            </p>
          </div>
          {search.version
            ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate({
                    search: (prev) => ({
                      ...prev,
                      version: undefined,
                    }),
                  })}
                >
                  <span>
                    Version
                    {" "}
                    {search.version}
                  </span>
                  <X className="size-3" />
                </Button>
              )
            : null}
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-2">
            <CardTitle className="text-base">Search characters</CardTitle>
            <div className="relative w-full max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, codepoint, block, script..."
                className="pl-9"
                value={query}
                onChange={handleChange}
              />
              {query
                ? (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={handleClear}
                    >
                      <X className="size-3" />
                      <span className="sr-only">Clear search</span>
                    </Button>
                  )
                : null}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>Tip: use "U+" or hex codepoints (e.g. U+1F600).</span>
              {search.version
                ? (
                    <span>
                      Searching within Unicode
                      {" "}
                      {search.version}
                      .
                    </span>
                  )
                : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <SearchResults query={searchInput.query} version={searchInput.version} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SearchResults({ query, version }: { query: string; version?: string }) {
  if (!query) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        Start typing to search for characters.
      </div>
    );
  }

  return (
    <Suspense fallback={<SearchResultsSkeleton />}>
      <SearchResultsContent query={query} version={version} />
    </Suspense>
  );
}

function SearchResultsContent({ query, version }: { query: string; version?: string }) {
  const { data } = useSuspenseQuery(searchCharactersQueryOptions({ query, version }));

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        No results match
        {" "}
        <span className="font-medium text-foreground">{query}</span>
        . Try another query.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="secondary">
          {data.length}
          {" "}
          results
        </Badge>
        {version && (
          <Badge variant="outline">
            Version
            {" "}
            {version}
          </Badge>
        )}
      </div>
      {data.map((result) => (
        <div key={result.codepoint} className="flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-card/70 p-3">
          <div className="min-w-[220px]">
            <div className="flex items-center gap-2">
              <div className="text-2xl">{result.character}</div>
              <div>
                <div className="font-mono text-sm">
                  U+
                  {result.codepoint}
                </div>
                <div className="text-xs text-muted-foreground">{result.name}</div>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <Badge variant="outline">{result.block}</Badge>
              <Badge variant="outline">{result.script}</Badge>
              <Badge variant="outline">{result.category}</Badge>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              size="sm"
              nativeButton={false}
              render={(
                <Link
                  to="/v/$version/u/$hex"
                  params={{
                    version: result.version,
                    hex: result.codepoint,
                  }}
                >
                  Open in version
                  {" "}
                  {result.version}
                </Link>
              )}
            />
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link to="/codepoint-inspector">Open inspector</Link>}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function SearchResultsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={`search-skeleton-${index}`} className="rounded-lg border bg-card/70 p-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-md" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

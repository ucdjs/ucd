import { VersionsCardList, VersionsCardListSkeleton } from "#components/home/versions/versions-list";
import { versionsQueryOptions } from "#functions/versions";
import { createFileRoute, Link, useLoaderData } from "@tanstack/react-router";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@ucdjs-internal/shared-ui/ui/breadcrumb";
import { Button } from "@ucdjs-internal/shared-ui/ui/button";
import { Separator } from "@ucdjs-internal/shared-ui/ui/separator";
import { SidebarTrigger } from "@ucdjs-internal/shared-ui/ui/sidebar";
import { BookOpen, Code2, ExternalLink, Hash, Layers, Search, Terminal } from "lucide-react";
import { Suspense } from "react";

export const Route = createFileRoute("/")({
  component: HomePage,
  loader: ({ context }) => {
    context.queryClient.prefetchQuery(versionsQueryOptions());
  },
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "UCD.js - Unicode Character Database",
      },
    ],
  }),
});

function HomePage() {
  const { ucdjsApiBaseUrl } = useLoaderData({ from: "__root__" });

  return (
    <>
      <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Home</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-8 p-4 pt-2">
        <section className="flex flex-col gap-4 py-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary text-primary-foreground flex size-10 items-center justify-center rounded-lg">
              <Hash className="size-5" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">UCD.js</h1>
              <p className="text-sm text-muted-foreground">
                Unicode Character Database for JavaScript
              </p>
            </div>
          </div>
          <p className="max-w-2xl text-sm text-muted-foreground leading-relaxed">
            Browse Unicode versions, inspect codepoints, and navigate the raw UCD files.
            Use the search tools to jump to characters, blocks, and properties fast.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                nativeButton={false}
                render={(
                  <Link to="/search">
                    <Search className="size-4" />
                    Search characters
                  </Link>
                )}
              />
              <Button
                variant="outline"
                size="sm"
                nativeButton={false}
                render={(
                  <Link to="/file-explorer">
                    <Terminal className="size-4" />
                    File explorer
                  </Link>
                )}
              />
              <Button
                variant="outline"
                size="sm"
                nativeButton={false}
                render={(
                  <a href={ucdjsApiBaseUrl ?? "https://api.ucdjs.dev"} target="_blank" rel="noopener noreferrer">
                    <Code2 className="size-4" />
                    API reference
                  </a>
                )}
              />
            </div>
            <Separator
              orientation="vertical"
              className="hidden sm:block data-[orientation=vertical]:h-4"
            />
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="uppercase tracking-wide">References</span>
              <span className="hidden sm:inline">•</span>
              <a
                href="https://www.unicode.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-foreground"
              >
                <BookOpen className="size-3.5" />
                Unicode docs
              </a>
              <span className="hidden sm:inline">•</span>
              <a
                href="https://github.com/ucdjs/ucd"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-foreground"
              >
                <ExternalLink className="size-3.5" />
                GitHub repository
              </a>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wide">
            <Layers className="size-4" />
            Unicode versions
          </h2>
          {/* <Suspense fallback={<VersionsCardListSkeleton />}> */}
          <VersionsCardList />
          {/* </Suspense> */}
        </section>
      </div>
    </>
  );
}

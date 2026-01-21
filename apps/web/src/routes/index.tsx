import { VersionsCardList, VersionsCardListSkeleton } from "#components/home/versions-list";
import { versionsQueryOptions } from "#functions/versions";
import { createFileRoute, Link, useLoaderData } from "@tanstack/react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  Button,
  Separator,
  SidebarTrigger,
} from "@ucdjs-internal/shared-ui/components";
import { BookOpen, Code2, ExternalLink, Hash, Layers, Search } from "lucide-react";
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
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
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

      <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        {/* Hero Section */}
        <div className="flex flex-col gap-4 py-6">
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
          <p className="max-w-3xl text-sm text-muted-foreground leading-relaxed">
            Explore the Unicode Character Database with a modern, developer-friendly interface.
            Browse characters, blocks, scripts, and properties across all Unicode versions.
            Access comprehensive Unicode data through powerful search and filtering capabilities.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={(
              <Link to="/file-explorer">
                <Search className="size-4" />
                Character Search
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
                API Reference
              </a>
            )}
          />
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={(
              <a href="https://github.com/ucdjs/ucd" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4" />
                GitHub
              </a>
            )}
          />
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={(
              <a href="https://www.unicode.org/" target="_blank" rel="noopener noreferrer">
                <BookOpen className="size-4" />
                Unicode Docs
              </a>
            )}
          />
        </div>

        <section>
          <h2 className="mb-4 text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wide">
            <Layers className="size-4" />
            Unicode Versions
          </h2>
          <Suspense fallback={<VersionsCardListSkeleton />}>
            <VersionsCardList />
          </Suspense>
        </section>
      </div>
    </>
  );
}

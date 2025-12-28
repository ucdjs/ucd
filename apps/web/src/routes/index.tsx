import {
  ArrowRightIcon,
  ArrowSquareOutIcon,
  HashStraightIcon,
  MagnifyingGlassIcon,
  StackSimpleIcon,
} from "@phosphor-icons/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { versionsQueryOptions } from "@/apis/versions";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export const Route = createFileRoute("/")({
  component: HomePage,
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(versionsQueryOptions());
  },
});

function HomePage() {
  const { data: versions } = useSuspenseQuery(versionsQueryOptions());

  const latestVersion = versions[0];

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
              <HashStraightIcon className="size-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">UCD.js</h1>
              <p className="text-sm text-muted-foreground">
                Unicode Character Database for JavaScript
              </p>
            </div>
          </div>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Explore the Unicode Character Database with a modern, developer-friendly interface.
            Browse characters, blocks, scripts, and properties across all Unicode versions.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={(
              <Link to="/file-explorer">
                <MagnifyingGlassIcon className="size-4" />
                Character Explorer
              </Link>
            )}
          />
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={(
              <a href="https://api.ucdjs.dev" target="_blank" rel="noopener noreferrer">
                <ArrowSquareOutIcon className="size-4" />
                API Reference
              </a>
            )}
          />
        </div>

        <section>
          <h2 className="mb-3 text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wide">
            <StackSimpleIcon className="size-4" />
            Unicode Versions
          </h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {versions.map((version) => (
              <Link
                key={version.version}
                to="/v/$version"
                params={{ version: version.version }}
                className="group flex items-center justify-between rounded-lg border bg-card p-3 hover:bg-accent hover:border-accent transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium">{version.version}</span>
                  {version.version === latestVersion?.version && (
                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">
                      Latest
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-xs">{version.date}</span>
                  <ArrowRightIcon className="size-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

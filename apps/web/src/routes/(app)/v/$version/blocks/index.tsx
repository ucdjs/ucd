import { blocksQueryOptions } from "#functions/blocks";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@ucdjs-internal/shared-ui/ui/breadcrumb";
import { Card, CardContent } from "@ucdjs-internal/shared-ui/ui/card";
import { Input } from "@ucdjs-internal/shared-ui/ui/input";
import { Separator } from "@ucdjs-internal/shared-ui/ui/separator";
import { SidebarTrigger } from "@ucdjs-internal/shared-ui/ui/sidebar";
import { Grid3X3, Search } from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/(app)/v/$version/blocks/")({
  component: BlocksPage,
  loader: ({ context, params }) => {
    context.queryClient.ensureQueryData(blocksQueryOptions(params.version));
  },
});

function BlocksPage() {
  const { version } = Route.useParams();
  const { data: blocks } = useSuspenseQuery(blocksQueryOptions(version));
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBlocks = useMemo(() => {
    if (!searchQuery.trim()) return blocks;
    const query = searchQuery.toLowerCase();
    return blocks.filter((block) =>
      block.name.toLowerCase().includes(query)
      || block.start.toLowerCase().includes(query)
      || block.end.toLowerCase().includes(query),
    );
  }, [blocks, searchQuery]);

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
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink render={<Link to="/">Home</Link>} />
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink render={(
                  <Link to="/v/$version" params={{ version }}>
                    Unicode
                    {version}
                  </Link>
                )}
                />
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Blocks</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        {/* Page Header */}
        <div className="flex flex-col gap-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Grid3X3 className="size-6 text-primary" />
              <h1 className="text-2xl font-bold tracking-tight">
                Unicode Blocks
              </h1>
            </div>
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search blocks..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Browse all Unicode blocks for version
            {" "}
            {version}
            . Each block represents a contiguous range of code points
            assigned to characters with similar characteristics or from related writing systems.
          </p>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-1.5">
            <span className="font-semibold">{filteredBlocks.length}</span>
            <span className="text-muted-foreground">blocks</span>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-1.5">
            <span className="font-semibold">
              {filteredBlocks.reduce((sum, block) => sum + block.characterCount, 0).toLocaleString()}
            </span>
            <span className="text-muted-foreground">total characters</span>
          </div>
        </div>

        {/* Blocks Grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredBlocks.map((block) => (
            <Link
              key={block.id}
              to="/v/$version/blocks/$id"
              params={{ version, id: block.id }}
            >
              <Card className="h-full transition-colors hover:bg-muted/50 cursor-pointer group">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-sm leading-tight group-hover:text-primary transition-colors">
                      {block.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-mono bg-muted px-1.5 py-0.5 rounded">
                      U+
                      {block.start}
                    </span>
                    <span>to</span>
                    <span className="font-mono bg-muted px-1.5 py-0.5 rounded">
                      U+
                      {block.end}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {block.characterCount.toLocaleString()}
                      {" "}
                      characters
                    </span>
                    <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      View →
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {filteredBlocks.length === 0 && (
          <div className="text-center py-12">
            <Grid3X3 className="size-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No blocks found</h3>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search query
            </p>
          </div>
        )}
      </div>
    </>
  );
}

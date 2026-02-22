import { blockQueryOptions } from "#functions/blocks";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@ucdjs-internal/shared-ui/ui/breadcrumb";
import { Button } from "@ucdjs-internal/shared-ui/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";
import { Separator } from "@ucdjs-internal/shared-ui/ui/separator";
import { SidebarTrigger } from "@ucdjs-internal/shared-ui/ui/sidebar";
import { Grid3X3, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/(app)/v/$version/blocks/$id")({
  component: BlockDetailPage,
  loader: ({ context, params }) => {
    context.queryClient.ensureQueryData(blockQueryOptions(params.version, params.id));
  },
});

function BlockDetailPage() {
  const { version, id } = Route.useParams();
  const { data: block } = useSuspenseQuery(blockQueryOptions(version, id));

  // Generate sample characters from the block
  const sampleCharacters = [];
  const sampleSize = Math.min(16, block.characterCount);
  const step = Math.max(1, Math.floor(block.characterCount / sampleSize));
  
  for (let i = 0; i < sampleSize && (block.startCodepoint + i * step) <= block.endCodepoint; i++) {
    const codepoint = block.startCodepoint + i * step;
    try {
      const char = String.fromCodePoint(codepoint);
      sampleCharacters.push({
        codepoint: `U+${codepoint.toString(16).toUpperCase().padStart(4, "0")}`,
        character: char,
        hex: codepoint.toString(16).toUpperCase(),
      });
    } catch {
      // Skip invalid codepoints
    }
  }

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
                <BreadcrumbLink render={<Link to="/v/$version" params={{ version }}>Unicode {version}</Link>} />
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink render={<Link to="/v/$version/blocks" params={{ version }}>Blocks</Link>} />
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage className="max-w-[200px] truncate">
                  {block.name}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        {/* Back Button */}
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            render={(
              <Link to="/v/$version/blocks" params={{ version }}>
                <ArrowLeft className="size-4" />
                Back to blocks
              </Link>
            )}
          />
        </div>

        {/* Page Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Grid3X3 className="size-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {block.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                Unicode Block • Version {version}
              </p>
            </div>
          </div>
        </div>

        {/* Block Info Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-normal text-muted-foreground uppercase tracking-wide">
                Character Count
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">
                {block.characterCount.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-normal text-muted-foreground uppercase tracking-wide">
                Start Codepoint
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold font-mono">
                U+{block.start}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-normal text-muted-foreground uppercase tracking-wide">
                End Codepoint
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold font-mono">
                U+{block.end}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-normal text-muted-foreground uppercase tracking-wide">
                Range Size
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">
                {((block.endCodepoint - block.startCodepoint + 1) / 1024).toFixed(1)} KB
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sample Characters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Sample Characters</CardTitle>
          </CardHeader>
          <CardContent>
            {sampleCharacters.length > 0 ? (
              <div className="grid grid-cols-8 sm:grid-cols-16 gap-2">
                {sampleCharacters.map((char, index) => (
                  <Link
                    key={index}
                    to="/v/$version/u/$hex"
                    params={{ version, hex: char.hex }}
                    className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-muted transition-colors"
                    title={`${char.codepoint}: Click to view details`}
                  >
                    <span className="text-2xl">{char.character}</span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {char.codepoint}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No displayable characters in this block
              </p>
            )}
          </CardContent>
        </Card>

        {/* Block Description */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">About this Block</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              The <strong>{block.name}</strong> block is a Unicode block containing 
              {block.characterCount.toLocaleString()} characters ranging from U+{block.start} to U+{block.end}.
            </p>
            <p className="text-sm text-muted-foreground">
              This block is part of the Unicode Standard version {version}. You can explore 
              individual characters by clicking on the sample characters above or by browsing 
              the full range in the file explorer.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

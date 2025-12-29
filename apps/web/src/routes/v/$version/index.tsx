import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Grid3X3, Search, Type } from "lucide-react";
import { versionDetailsQueryOptions } from "@/apis/versions";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { versionsQueryOptions } from "@/functions/versions";

export const Route = createFileRoute("/v/$version/")({
  component: VersionPage,
  loader: ({ context, params }) => {
    context.queryClient.ensureQueryData(versionsQueryOptions());
    context.queryClient.ensureQueryData(versionDetailsQueryOptions(params.version));
  },
});

function formatNumber(num: number): string {
  return num.toLocaleString();
}

function VersionPage() {
  const { version } = Route.useParams();
  const { data: versions } = useSuspenseQuery(versionsQueryOptions());
  const { data: details } = useQuery(versionDetailsQueryOptions(version));

  const versionData = versions.find((v) => v.version === version);
  const isLatest = versions[0]?.version === version;

  // Sample characters to showcase
  const sampleCharacters = [
    { hex: "0041", name: "Latin Capital Letter A" },
    { hex: "03B1", name: "Greek Small Letter Alpha" },
    { hex: "4E2D", name: "CJK Unified Ideograph (中)" },
    { hex: "1F600", name: "Grinning Face Emoji" },
  ];

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
              <BreadcrumbItem>
                <BreadcrumbPage>
                  Unicode
                  {version}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        {/* Version Header - Compact */}
        <div className="flex flex-col gap-3 py-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              Unicode
              {" "}
              {version}
            </h1>
            {isLatest && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                Latest
              </span>
            )}
          </div>
          {versionData && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span>
                Released
                {versionData.date}
              </span>
              <span className="hidden sm:inline">·</span>
              <span className="capitalize">{versionData.type}</span>
              {versionData.documentationUrl && (
                <>
                  <span className="hidden sm:inline">·</span>
                  <a
                    href={versionData.documentationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <BookOpen className="size-3" />
                    Docs
                  </a>
                </>
              )}
              <span className="hidden sm:inline">·</span>
              <a
                href={versionData.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Source
              </a>
            </div>
          )}
          {/* Version Statistics */}
          {details && details.totalCharacters > 0 && (
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-1.5">
                <span className="font-semibold">{formatNumber(details.totalCharacters)}</span>
                <span className="text-muted-foreground">characters</span>
                {details.newCharacters > 0 && (
                  <span className="text-xs text-green-600 dark:text-green-400">
                    (+
                    {formatNumber(details.newCharacters)}
                    {" "}
                    new)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-1.5">
                <span className="font-semibold">{formatNumber(details.totalBlocks)}</span>
                <span className="text-muted-foreground">blocks</span>
                {details.newBlocks > 0 && (
                  <span className="text-xs text-green-600 dark:text-green-400">
                    (+
                    {details.newBlocks}
                    {" "}
                    new)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-1.5">
                <span className="font-semibold">{formatNumber(details.totalScripts)}</span>
                <span className="text-muted-foreground">scripts</span>
                {details.newScripts > 0 && (
                  <span className="text-xs text-green-600 dark:text-green-400">
                    (+
                    {details.newScripts}
                    {" "}
                    new)
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Navigation Cards */}
        <section>
          <h2 className="mb-4 text-lg font-semibold">Browse</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="hover:ring-primary/50 transition-all">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Grid3X3 className="size-5" />
                  Unicode Blocks
                </CardTitle>
                <CardDescription>
                  Browse characters by block
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Explore Basic Latin, Greek, CJK, Emoji, and hundreds of other Unicode blocks.
                </p>
              </CardContent>
              <CardFooter>
                <Link
                  to="/v/$version/blocks"
                  className={buttonVariants({
                    variant: "outline",
                    size: "sm",
                  })}
                  params={{ version }}
                >
                  View Blocks
                  <ArrowRight className="ml-1 size-4" />
                </Link>
              </CardFooter>
            </Card>

            <Card className="hover:ring-primary/50 transition-all">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Type className="size-5" />
                  Sample Characters
                </CardTitle>
                <CardDescription>
                  Quick character lookup
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {sampleCharacters.map((char) => (
                    <Link
                      key={char.hex}
                      to="/v/$version/u/$hex"
                      params={{ version, hex: char.hex }}
                      className="inline-flex items-center gap-1 px-2 py-1 text-sm bg-muted rounded-md hover:bg-muted/80 transition-colors"
                    >
                      <span className="font-mono text-xs text-muted-foreground">
                        U+
                        {char.hex}
                      </span>
                      <span className="text-lg">
                        {String.fromCodePoint(Number.parseInt(char.hex, 16))}
                      </span>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="hover:ring-primary/50 transition-all">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="size-5" />
                  Search (Version)
                </CardTitle>
                <CardDescription>
                  Search within this Unicode release
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Search names, properties, blocks, and run regex/fuzzy queries scoped to this Unicode version.
                </p>
              </CardContent>
              <CardFooter>
                <Link
                  to="/v/$version/search"
                  className={buttonVariants({
                    variant: "outline",
                    size: "sm",
                  })}
                  params={{ version }}
                >
                  Open Search
                  <ArrowRight className="ml-1 size-4" />
                </Link>
              </CardFooter>
            </Card>
          </div>
        </section>
      </div>
    </>
  );
}

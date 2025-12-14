import { createFileRoute, Link } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { ArrowRight, BookOpen, Grid3X3, Type } from 'lucide-react'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { versionsQueryOptions } from '@/apis/versions'

export const Route = createFileRoute('/v/$version/')({
  component: VersionPage,
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(versionsQueryOptions())
  },
})

function VersionPage() {
  const { version } = Route.useParams()
  const { data: versions } = useSuspenseQuery(versionsQueryOptions())

  const versionData = versions.find(v => v.version === version)
  const isLatest = versions[0]?.version === version

  // Sample characters to showcase
  const sampleCharacters = [
    { hex: '0041', name: 'Latin Capital Letter A' },
    { hex: '03B1', name: 'Greek Small Letter Alpha' },
    { hex: '4E2D', name: 'CJK Unified Ideograph (中)' },
    { hex: '1F600', name: 'Grinning Face Emoji' },
  ]

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
                <BreadcrumbPage>Unicode {version}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-8 p-4 pt-0">
        {/* Version Header */}
        <div className="flex flex-col gap-2 py-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              Unicode {version}
            </h1>
            {isLatest && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                Latest
              </span>
            )}
          </div>
          {versionData && (
            <p className="text-muted-foreground">
              Released {versionData.date} · {versionData.type === 'stable' ? 'Stable release' : versionData.type}
            </p>
          )}
          {versionData?.documentationUrl && (
            <a
              href={versionData.documentationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline inline-flex items-center gap-1"
            >
              <BookOpen className="size-4" />
              Official Documentation
            </a>
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
                <Button variant="outline" size="sm" render={
                  <Link to="/v/$version/blocks" params={{ version }}>
                    View Blocks
                    <ArrowRight className="ml-1 size-4" />
                  </Link>
                } />
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
                        U+{char.hex}
                      </span>
                      <span className="text-lg">
                        {String.fromCodePoint(parseInt(char.hex, 16))}
                      </span>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Version Info */}
        {versionData && (
          <section>
            <h2 className="mb-4 text-lg font-semibold">Version Details</h2>
            <Card>
              <CardContent className="pt-6">
                <dl className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Version</dt>
                    <dd className="text-sm">{versionData.version}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Release Date</dt>
                    <dd className="text-sm">{versionData.date}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Type</dt>
                    <dd className="text-sm capitalize">{versionData.type}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Data URL</dt>
                    <dd className="text-sm">
                      <a
                        href={versionData.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {versionData.url}
                      </a>
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </>
  )
}

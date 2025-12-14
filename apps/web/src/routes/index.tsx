import { createFileRoute, Link } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { ArrowRight, Hash, Layers, Search } from 'lucide-react'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
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

export const Route = createFileRoute('/')({
  component: HomePage,
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(versionsQueryOptions())
  },
})

function HomePage() {
  const { data: versions } = useSuspenseQuery(versionsQueryOptions())

  // Featured versions
  const featuredVersions = ['17.0.0', '16.0.0', '15.1.0']
  const featured = featuredVersions
    .map(v => versions.find(ver => ver.version === v))
    .filter(Boolean)

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

      <div className="flex flex-1 flex-col gap-8 p-4 pt-0">
        {/* Hero Section */}
        <div className="flex flex-col gap-4 py-8">
          <div className="flex items-center gap-3">
            <div className="bg-primary text-primary-foreground flex size-12 items-center justify-center rounded-xl">
              <Hash className="size-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">UCD.js</h1>
              <p className="text-muted-foreground">
                Unicode Character Database for JavaScript
              </p>
            </div>
          </div>
          <p className="max-w-2xl text-muted-foreground">
            Explore the Unicode Character Database with a modern, developer-friendly interface.
            Browse characters, blocks, scripts, and properties across all Unicode versions.
          </p>
        </div>

        {/* Featured Versions */}
        <section>
          <h2 className="mb-4 text-xl font-semibold flex items-center gap-2">
            <Layers className="size-5" />
            Unicode Versions
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {featured.map((version) => (
              <Card key={version!.version} className="group hover:ring-primary/50 transition-all">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Unicode {version!.version}
                    {version!.version === versions[0]?.version && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                        Latest
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Released {version!.date}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {version!.type === 'stable' ? 'Stable release' : version!.type} of the Unicode Standard
                  </p>
                </CardContent>
                <CardFooter className="gap-2">
                  <Button nativeButton={false} render={
                    <Link to="/v/$version" params={{ version: version!.version }}>
                      Explore
                      <ArrowRight className="ml-1 size-4" />
                    </Link>
                  } />
                  <Button variant="outline" nativeButton={false} render={
                    <a href={version!.documentationUrl} target="_blank" rel="noopener noreferrer">
                      Docs
                    </a>
                  } />
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="mb-4 text-xl font-semibold flex items-center gap-2">
            <Search className="size-5" />
            Quick Actions
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="hover:ring-primary/50 transition-all">
              <CardHeader>
                <CardTitle>Character Explorer</CardTitle>
                <CardDescription>
                  Search and browse Unicode characters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Find characters by name, codepoint, or properties. View detailed information
                  about each character including its category, script, and related characters.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" nativeButton={false} render={
                  <Link to="/explorer">
                    Open Explorer
                    <ArrowRight className="ml-1 size-4" />
                  </Link>
                } />
              </CardFooter>
            </Card>

            <Card className="hover:ring-primary/50 transition-all">
              <CardHeader>
                <CardTitle>API Reference</CardTitle>
                <CardDescription>
                  Access Unicode data programmatically
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Use our REST API to query Unicode data in your applications.
                  Supports all Unicode versions with comprehensive character metadata.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" nativeButton={false} render={
                  <a href="https://api.ucdjs.dev" target="_blank" rel="noopener noreferrer">
                    View API Docs
                    <ArrowRight className="ml-1 size-4" />
                  </a>
                } />
              </CardFooter>
            </Card>
          </div>
        </section>
      </div>
    </>
  )
}

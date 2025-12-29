import { createFileRoute, Link } from "@tanstack/react-router";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/v/$version/grapheme-visualizer")({
  component: GraphemeVisualizerVersion,
});

function GraphemeVisualizerVersion() {
  const params = Route.useParams();

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <header className="flex items-center gap-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink render={<Link to="/">Home</Link>} />
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink render={(
                <Link to="/v/$version" params={{ version: params.version }}>
                  Unicode
                  {params.version}
                </Link>
              )}
              />
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>Grapheme & ZWJ Visualizer</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>
            Grapheme & ZWJ Visualizer —
            {params.version}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Break text into grapheme clusters for Unicode
            {" "}
            {params.version}
            , show component parts of ZWJ sequences (emoji parts, modifiers) and describe cluster boundaries.
          </p>
          <Button nativeButton={false} render={<Link to="/v/$version" params={{ version: params.version }}>Back to version</Link>} />
        </CardContent>
      </Card>
    </div>
  );
}

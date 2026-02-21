import { createFileRoute, Link } from "@tanstack/react-router";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@ucdjs-internal/shared-ui/ui/breadcrumb";
import { Button } from "@ucdjs-internal/shared-ui/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";

export const Route = createFileRoute("/(app)/codepoint-inspector")({
  component: CodepointInspectorIdea,
});

function CodepointInspectorIdea() {
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
              <BreadcrumbLink render={<Link to="/codepoint-inspector">Code Point Inspector</Link>} />
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>Code Point Inspector</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Code Point Inspector</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Inspect a character by input, hex code, or name. Show properties (category, block, script, age), encodings (UTF-8/UTF-16), case mappings, decomposition, and sample glyphs.
          </p>
          <p className="text-sm text-muted-foreground">
            Note: this is a version-agnostic inspector. For a version-specific visualizer (kept feature), see
            {" "}
            <code className="bg-muted px-1.5 py-0.5 rounded">/v/:version/codepoint/:codepoint</code>
            {" "}
            which shows how a character appears in a specific Unicode release.
          </p>
          <Button nativeButton={false} render={<Link to="/codepoint-inspector">Back to Code Point Inspector</Link>} />
        </CardContent>
      </Card>
    </div>
  );
}

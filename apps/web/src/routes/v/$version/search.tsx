import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/v/$version/search")({
  component: VersionSearchPage,
});

function VersionSearchPage() {
  const { version } = Route.useParams();

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
                <Link to="/v/$version" params={{ version }}>
                  Unicode
                  {version}
                </Link>
              )}
              />
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>Search</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>
            Search within Unicode
            {version}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Run searches scoped to this Unicode release: name, block, script, properties, or regex and fuzzy matches. Results reflect properties as defined in
            {" "}
            {version}
            .
          </p>
          <Button
            nativeButton={false}
            render={
              <Link to="/search">Back to ideas</Link>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}

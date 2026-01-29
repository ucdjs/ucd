import { createFileRoute, Link } from "@tanstack/react-router";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@ucdjs-internal/shared-ui/ui/breadcrumb";
import { Button } from "@ucdjs-internal/shared-ui/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";
import { Input } from "@ucdjs-internal/shared-ui/ui/input";

export const Route = createFileRoute("/search")({
  component: GlobalSearchPage,
});

const MOCK_RESULTS = [
  { codepoint: "0041", name: "LATIN CAPITAL LETTER A", version: "1.1.0" },
  { codepoint: "03B1", name: "GREEK SMALL LETTER ALPHA", version: "1.1.0" },
  { codepoint: "1F600", name: "GRINNING FACE", version: "6.1.0" },
];

function GlobalSearchPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <header className="flex items-center gap-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink render={<Link to="/">Home</Link>} />
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>Search</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <h1 className="text-2xl font-bold">Global Search</h1>

      <Card>
        <CardHeader>
          <CardTitle>Search Unicode (mocked)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 w-full max-w-lg">
            <Input placeholder="Search by name, codepoint, block, script..." />
          </div>

          <div className="space-y-3">
            {MOCK_RESULTS.map((r) => (
              <div key={r.codepoint} className="flex items-center justify-between gap-4 p-3 rounded-md bg-muted">
                <div>
                  <div className="font-mono">
                    U+
                    {r.codepoint}
                  </div>
                  <div className="text-sm text-muted-foreground">{r.name}</div>
                  <div className="text-xs text-muted-foreground/70">
                    Introduced in
                    {" "}
                    {r.version}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    nativeButton={false}
                    render={(
                      <Link
                        to="/v/$version/u/$hex"
                        params={{
                          version: r.version,
                          hex: r.codepoint,
                        }}
                      >
                        Open (version)
                      </Link>
                    )}
                  />
                  <Button nativeButton={false} render={<Link to="/codepoint-inspector">Open Inspector</Link>} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import * as React from "react";
import { versionDetailsQueryOptions, versionsQueryOptions } from "@/apis/versions";
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

export const Route = createFileRoute("/compare")({
  component: ComparePage,
});

function ComparePage() {
  const { data: versions } = useSuspenseQuery(versionsQueryOptions());
  const [left, setLeft] = React.useState<string | undefined>(versions?.[0]?.version);
  const [right, setRight] = React.useState<string | undefined>(versions?.[1]?.version);

  const leftQuery = useQuery({ ...(versionDetailsQueryOptions(left ?? "")), enabled: !!left });
  const rightQuery = useQuery({ ...(versionDetailsQueryOptions(right ?? "")), enabled: !!right });

  const leftDetails = leftQuery.data;
  const rightDetails = rightQuery.data;

  const diff = leftDetails && rightDetails
    ? {
        added: Math.max(0, rightDetails.totalCharacters - leftDetails.totalCharacters),
        removed: Math.max(0, leftDetails.totalCharacters - rightDetails.totalCharacters),
      }
    : null;

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
              <BreadcrumbPage>Compare</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <h1 className="text-2xl font-bold">Compare Unicode Versions</h1>

      <Card>
        <CardHeader>
          <CardTitle>Choose versions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 items-center flex-wrap">
            <label className="text-sm">Left</label>
            <select value={left} onChange={(e) => setLeft(e.target.value)} className="rounded-md p-2 border">
              {versions.map((v) => <option key={v.version} value={v.version}>{v.version}</option>)}
            </select>

            <label className="text-sm">Right</label>
            <select value={right} onChange={(e) => setRight(e.target.value)} className="rounded-md p-2 border">
              {versions.map((v) => <option key={v.version} value={v.version}>{v.version}</option>)}
            </select>

            <Button onClick={() => { /* noop for now */ }}>Compare</Button>
          </div>

          {diff && (
            <div className="mt-4">
              <div className="text-sm text-muted-foreground">Comparison summary</div>
              <div className="mt-2 flex gap-4">
                <div className="rounded-md bg-muted p-3">
                  <div className="text-xs text-muted-foreground">Characters added</div>
                  <div className="font-mono font-semibold">{diff.added}</div>
                </div>
                <div className="rounded-md bg-muted p-3">
                  <div className="text-xs text-muted-foreground">Characters removed</div>
                  <div className="font-mono font-semibold">{diff.removed}</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

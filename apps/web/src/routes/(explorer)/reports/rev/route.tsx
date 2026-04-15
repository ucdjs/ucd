import { createFileRoute, Link } from "@tanstack/react-router";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/components";

export const Route = createFileRoute("/(explorer)/reports/rev")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Select a report first</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-muted-foreground">
        <p>
          Revisions belong to a specific Unicode report. Pick a report from the sidebar to inspect its current,
          previous, or proposed revision metadata.
        </p>
        <Button
          size="sm"
          nativeButton={false}
          render={<Link to="/reports">Browse reports</Link>}
        />
      </CardContent>
    </Card>
  );
}

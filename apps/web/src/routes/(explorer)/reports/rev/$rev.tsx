import { createFileRoute, Link } from "@tanstack/react-router";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/components";

export const Route = createFileRoute("/(explorer)/reports/rev/$rev")({
  component: RouteComponent,
});

function RouteComponent() {
  const { rev } = Route.useParams();

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>
          Revision
          {" "}
          {rev}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-muted-foreground">
        <p>
          This route does not identify which report owns revision
          {" "}
          <strong>{rev}</strong>
          .
          Open a report from the sidebar to inspect revision metadata in context.
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

import { createFileRoute } from "@tanstack/react-router";
import { VersionHeader } from "@/components/layout/version/header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const Route = createFileRoute("/v/$version/search")({
  component: VersionSearchPage,
});

function VersionSearchPage() {
  const { version } = Route.useParams();

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <VersionHeader version={version} title="Search" />

      <Card>
        <CardHeader>
          <CardTitle>
            Search within Unicode
            {" "}
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
        </CardContent>
      </Card>
    </div>
  );
}

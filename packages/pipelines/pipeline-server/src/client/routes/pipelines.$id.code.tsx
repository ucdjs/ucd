import type { CodeResponse } from "../types";
import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";

export const Route = createFileRoute("/pipelines/$id/code")({
  loader: async ({ params }): Promise<CodeResponse> => {
    const res = await fetch(`/api/pipelines/${params.id}/code`);
    if (!res.ok) {
      throw new Error(`Failed to load code (${res.status})`);
    }
    return res.json();
  },
  component: PipelineCodePage,
});

interface ErrorDisplayProps {
  error: string;
}

function ErrorDisplay({ error }: ErrorDisplayProps) {
  return (
    <Card role="alert">
      <CardHeader>
        <CardTitle>Pipeline Code</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-destructive">{error}</p>
      </CardContent>
    </Card>
  );
}

interface CodeDisplayProps {
  code: string;
  filePath: string;
}

function CodeDisplay({ code, filePath }: CodeDisplayProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pipeline Code</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-3 font-mono">{filePath}</p>
        <pre className="rounded-md bg-muted/50 p-4 text-sm overflow-auto">
          <code>{code}</code>
        </pre>
      </CardContent>
    </Card>
  );
}

function EmptyCodeDisplay({ pipelineId }: { pipelineId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pipeline Code</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-3">{pipelineId}</p>
        <pre className="rounded-md bg-muted/50 p-4 text-sm overflow-auto">
          <code>No code found.</code>
        </pre>
      </CardContent>
    </Card>
  );
}

function PipelineCodePage() {
  const { id } = Route.useParams();
  const data = Route.useLoaderData();

  if (data?.error) {
    return <ErrorDisplay error={data.error} />;
  }

  if (!data?.code) {
    return (
      <div
        role="tabpanel"
        id="tabpanel-code"
        aria-labelledby="tab-code"
      >
        <EmptyCodeDisplay pipelineId={id} />
      </div>
    );
  }

  return (
    <div
      role="tabpanel"
      id="tabpanel-code"
      aria-labelledby="tab-code"
    >
      <CodeDisplay
        code={data.code}
        filePath={data.filePath ?? id}
      />
    </div>
  );
}

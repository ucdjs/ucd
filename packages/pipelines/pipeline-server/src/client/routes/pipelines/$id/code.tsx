import type { CodeResponse } from "../../../types";
import { createFileRoute, useSearch } from "@tanstack/react-router";
import { ShikiCode } from "@ucdjs-internal/shared-ui/components/shiki-code";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";
import { useEffect, useRef } from "react";

interface CodeSearchParams {
  route?: string;
}

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

function CodeDisplay({ code, filePath, highlightRoute }: { code: string; filePath: string; highlightRoute?: string }) {
  const codeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (highlightRoute && codeRef.current) {
      const routePattern = new RegExp(`route\\s*:\\s*["\']${highlightRoute}["\']`, "i");
      const match = code.match(routePattern);
      if (match) {
        const lines = code.substring(0, match.index).split("\n");
        const lineNumber = lines.length;

        const scrollContainer = codeRef.current.querySelector(".shiki") || codeRef.current;
        const lineElement = scrollContainer.querySelector(`[data-line="${lineNumber}"]`);
        if (lineElement) {
          lineElement.scrollIntoView({ behavior: "smooth", block: "center" });
          lineElement.classList.add("bg-yellow-500/20");
        }
      }
    }
  }, [code, highlightRoute]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Pipeline Code</CardTitle>
        <CardDescription>
          <code className="text-xs">{filePath}</code>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div ref={codeRef} className="rounded-lg border bg-muted/30 overflow-hidden">
          <ShikiCode
            code={code}
            language="typescript"
            className="text-xs overflow-auto max-h-[60vh]"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyCodeDisplay({ pipelineId }: { pipelineId: string }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Pipeline Code</CardTitle>
        <CardDescription>{pipelineId}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border bg-muted/30 p-8 text-center">
          <p className="text-sm text-muted-foreground">No code found.</p>
        </div>
      </CardContent>
    </Card>
  );
}

function PipelineCodePage() {
  const { id } = Route.useParams();
  const data = Route.useLoaderData();
  const search = useSearch({ from: "/pipelines/$id/code" }) as CodeSearchParams;
  const highlightRoute = search?.route;

  return (
    <div role="tabpanel" id="tabpanel-code" aria-labelledby="tab-code" className="p-6">
      {data.code
        ? (
            <CodeDisplay
              code={data.code}
              filePath={data.filePath ?? id}
              highlightRoute={highlightRoute}
            />
          )
        : (
            <EmptyCodeDisplay pipelineId={id} />
          )}
    </div>
  );
}

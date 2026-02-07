import type { CodeResponse } from "../../../types";
import { createFileRoute, useSearch } from "@tanstack/react-router";
import { ShikiCode } from "@ucdjs-internal/shared-ui/components/shiki-code";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";
import { useEffect, useMemo, useRef } from "react";

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

  const routeInfo = useMemo(() => {
    if (!highlightRoute) {
      return null;
    }

    const escapedRoute = highlightRoute.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const routePattern = new RegExp(`route\\s*:\\s*["\']${escapedRoute}["\']`, "i");
    const match = routePattern.exec(code);
    if (!match || match.index == null) {
      return null;
    }

    const prefix = code.slice(0, match.index);
    const lineIndex = Math.max(0, prefix.split("\n").length - 1);
    const lines = code.split("\n");
    const lineText = lines[lineIndex] ?? "";

    return {
      lineIndex,
      lineNumber: lineIndex + 1,
      lineText,
      matchIndex: match.index,
      matchLength: match[0].length,
      label: `Route: ${highlightRoute}`,
    };
  }, [code, highlightRoute]);

  const decorations = useMemo(() => {
    const items: {
      start: number;
      end: number;
      properties: { class: string[]; "data-label": string };
      alwaysWrap?: boolean;
    }[] = [];

    const addDecorationFromMatch = (
      pattern: RegExp,
      label: (match: RegExpExecArray) => string,
      className: string,
    ) => {
      const match = pattern.exec(code);
      if (!match || match.index == null) {
        return;
      }

      items.push({
        start: match.index,
        end: match.index + match[0].length,
        properties: {
          class: ["shiki-decor", className],
          "data-label": label(match),
        },
        alwaysWrap: true,
      });
    };

    if (routeInfo) {
      items.push({
        start: routeInfo.matchIndex,
        end: routeInfo.matchIndex + routeInfo.matchLength,
        properties: {
          class: ["shiki-decor", "shiki-decor-route"],
          "data-label": routeInfo.label,
        },
        alwaysWrap: true,
      });
    }

    addDecorationFromMatch(
      /id\s*:\s*["']([^"']+)["']/i,
      (match) => `Id: ${match[1]}`,
      "shiki-decor-id",
    );

    addDecorationFromMatch(
      /name\s*:\s*["']([^"']+)["']/i,
      (match) => `Name: ${match[1]}`,
      "shiki-decor-name",
    );

    return items.length ? items : undefined;
  }, [code, routeInfo]);

  useEffect(() => {
    if (!routeInfo || !codeRef.current) {
      return;
    }

    const scrollContainer = codeRef.current.querySelector(".shiki") || codeRef.current;
    const lineElement = scrollContainer.querySelector(`[data-line="${routeInfo.lineNumber}"]`);
    if (lineElement) {
      lineElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [routeInfo]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Pipeline Code</CardTitle>
        <CardDescription>
          <code className="text-xs">{filePath}</code>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div ref={codeRef} className="rounded-lg border bg-muted/20 shadow-sm overflow-hidden">
          <ShikiCode
            code={code}
            language="typescript"
            decorations={decorations}
            preClassName="max-h-[60vh]"
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

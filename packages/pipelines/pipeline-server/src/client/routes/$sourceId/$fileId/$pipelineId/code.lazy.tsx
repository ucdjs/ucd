import { createLazyFileRoute, useSearch } from "@tanstack/react-router";
import { ShikiCode } from "@ucdjs-internal/shared-ui/components";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { Button } from "@ucdjs-internal/shared-ui/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";
import { Separator } from "@ucdjs-internal/shared-ui/ui/separator";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface CodeSearchParams {
  route?: string;
}

export const Route = createLazyFileRoute("/$sourceId/$fileId/$pipelineId/code")({
  component: PipelineCodePage,
});

function CodeDisplay({
  code,
  filePath,
  fileLabel,
  highlightRoute,
}: {
  code: string;
  filePath: string;
  fileLabel?: string;
  highlightRoute?: string;
}) {
  const codeRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

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
      properties: { "class": string[]; "data-label": string };
      alwaysWrap?: boolean;
    }[] = [];

    if (routeInfo) {
      items.push({
        start: routeInfo.matchIndex,
        end: routeInfo.matchIndex + routeInfo.matchLength,
        properties: {
          "class": ["shiki-decor", "shiki-decor-route"],
          "data-label": routeInfo.label,
        },
        alwaysWrap: true,
      });
    }

    return items.length ? items : undefined;
  }, [routeInfo]);

  const stats = useMemo(() => {
    const lines = code.split("\n").length;
    return {
      lines,
      chars: code.length,
    };
  }, [code]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }, [code]);

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
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardDescription className="text-xs">
            <div className="text-xs text-muted-foreground">
              {fileLabel ?? filePath}
            </div>
            <code className="text-[11px] break-all text-muted-foreground/80">{filePath}</code>
          </CardDescription>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="text-[0.6rem]">TS</Badge>
            <Button size="sm" variant="ghost" className="h-6 px-2 text-[0.7rem]" onClick={handleCopy}>
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>
        <div className="mt-1 flex items-center gap-2 text-[0.65rem] text-muted-foreground">
          <span>{stats.lines} lines</span>
          <Separator orientation="vertical" className="h-3" />
          <span>{stats.chars} chars</span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <span id="pipeline-code-desc" className="sr-only">
          Pipeline source code. Use arrow keys to navigate the content.
        </span>
        <div
          ref={codeRef}
          className="rounded-md border bg-muted/5 overflow-hidden"
          role="region"
          aria-describedby="pipeline-code-desc"
          aria-label="Pipeline source code"
        >
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
  const { pipelineId } = Route.useParams();
  const { codeData } = Route.useLoaderData();
  const search = useSearch({ from: "/$sourceId/$fileId/$pipelineId/code" }) as CodeSearchParams;
  const highlightRoute = search?.route;

  return (
    <div role="tabpanel" id="tabpanel-code" aria-labelledby="tab-code" className="p-6">
      {codeData?.code
        ? (
            <CodeDisplay
              code={codeData.code}
              filePath={codeData.filePath ?? ""}
              fileLabel={codeData.fileLabel}
              highlightRoute={highlightRoute}
            />
          )
        : (
            <EmptyCodeDisplay pipelineId={pipelineId} />
          )}
    </div>
  );
}

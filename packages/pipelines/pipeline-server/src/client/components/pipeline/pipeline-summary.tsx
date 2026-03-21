import { Link } from "@tanstack/react-router";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";
import { FileCode2, FolderInput } from "lucide-react";

export interface PipelineSummaryProps {
  sourceId: string;
  sourceLabel: string;
  sourceCount: number;
  fileLabel: string;
  filePath: string;
  include?: string | null;
  versions: string[];
}

export function PipelineSummary({
  sourceId,
  sourceLabel,
  sourceCount,
  fileLabel,
  filePath,
  include,
  versions,
}: PipelineSummaryProps) {
  return (
    <Card className="xl:col-span-5 2xl:col-span-6">
      <CardHeader className="border-b border-border/60 pb-4">
        <CardTitle>Pipeline summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 pt-5">
        <div className="grid gap-2 sm:grid-cols-2">
          <div
            className="rounded-lg border border-border/60 px-3 py-3"
          >
            <div className="mb-1 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
              <FileCode2 className="h-3.5 w-3.5" />
              Definition file
            </div>
            <div className="text-sm font-medium text-foreground">{fileLabel}</div>
            <div className="mt-1 break-all text-xs text-muted-foreground">{filePath}</div>
          </div>

          <Link
            to="/s/$sourceId"
            params={{ sourceId }}
            className="rounded-lg border border-border/60 px-3 py-3 transition-colors hover:bg-muted/10"
          >
            <div className="mb-1 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
              <FolderInput className="h-3.5 w-3.5" />
              Source
            </div>
            <div className="text-sm font-medium text-foreground">{sourceLabel}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {sourceCount}
              {" "}
              attached
              {" "}
              {sourceCount === 1 ? "source" : "sources"}
            </div>
          </Link>
        </div>

        <div className="space-y-2">
          {include && (
            <>
              <div className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Scope
              </div>
              <code className="block break-all rounded-lg border border-border/60 px-3 py-2.5 text-xs text-foreground">
                {include}
              </code>
            </>
          )}
        </div>

        <div className="space-y-2">
          <div className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Supported versions
          </div>
          <div className="flex flex-wrap gap-1.5">
            {versions.map((version) => (
              <Badge key={version} variant="secondary" className="text-xs">
                {version}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

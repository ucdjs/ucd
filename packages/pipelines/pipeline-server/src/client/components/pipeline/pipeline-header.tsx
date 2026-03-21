import type { PipelineDetails } from "#queries/pipeline";
import { Link, useParams } from "@tanstack/react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@ucdjs-internal/shared-ui/ui/breadcrumb";
import { FileCode2 } from "lucide-react";

export interface PipelineHeaderProps {
  pipeline: PipelineDetails;
  sourceLabel: string;
  filePath: string;
}

export function PipelineHeader({
  pipeline,
  sourceLabel,
  filePath,
}: PipelineHeaderProps) {
  const { sourceId } = useParams({ from: "/s/$sourceId/$sourceFileId/$pipelineId" });

  return (
    <div className="border-b border-border/60 bg-background px-4 py-4 sm:px-6">
      <Breadcrumb>
        <BreadcrumbList className="text-xs">
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link to="/s/$sourceId" params={{ sourceId }}>{sourceLabel}</Link>} />
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{pipeline.name || pipeline.id}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mt-3 space-y-3">
        <h1 className="text-lg font-semibold tracking-tight text-foreground">
          {pipeline.name || pipeline.id}
        </h1>

        {pipeline.description && (
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
            {pipeline.description}
          </p>
        )}

        <div className="inline-flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          <FileCode2 className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{filePath}</span>
        </div>
      </div>
    </div>
  );
}

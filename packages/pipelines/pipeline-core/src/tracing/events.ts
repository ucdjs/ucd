import type { FileContext } from "../types";

export const PIPELINE_TRACE_PHASES = [
  "Pipeline",
  "Version",
  "Parse",
  "Resolve",
  "File",
  "Cache",
  "Error",
  "Other",
] as const;

export type PipelineTracePhase = typeof PIPELINE_TRACE_PHASES[number];

export function getTracePhase(kind: string): PipelineTracePhase {
  if (kind === "error") return "Error";
  if (kind.startsWith("pipeline.")) return "Pipeline";
  if (kind.startsWith("version.")) return "Version";
  if (kind.startsWith("parse.")) return "Parse";
  if (kind.startsWith("resolve.")) return "Resolve";
  if (kind.startsWith("file.") || kind.startsWith("source.")) return "File";
  if (kind.startsWith("cache.")) return "Cache";
  if (kind.startsWith("output.")) return "Other";
  return "Other";
}

export type PipelineErrorScope = "pipeline" | "version" | "file" | "route";

export interface PipelineError {
  scope: PipelineErrorScope;
  message: string;
  error?: unknown;
  file?: FileContext;
  routeId?: string;
  version?: string;
}

export type PipelineGraphNodeType = "source" | "file" | "route" | "output";

export type PipelineGraphNode
  = | { id: string; type: "source"; version: string }
    | { id: string; type: "file"; file: FileContext }
    | { id: string; type: "route"; routeId: string }
    | { id: string; type: "output"; outputIndex: number; property?: string; outputId?: string; locator?: string };

export type PipelineGraphEdgeType = "provides" | "matched" | "parsed" | "resolved";

export interface PipelineGraphEdge {
  from: string;
  to: string;
  type: PipelineGraphEdgeType;
}

export interface PipelineGraph {
  nodes: PipelineGraphNode[];
  edges: PipelineGraphEdge[];
}

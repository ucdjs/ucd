import type { FileContext } from "../types";

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

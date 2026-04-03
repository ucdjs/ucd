import type { FileContext } from "@ucdjs/pipelines-core";

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

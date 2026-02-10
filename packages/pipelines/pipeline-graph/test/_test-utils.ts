import type { PipelineGraphNode } from "@ucdjs/pipelines-core";

export function findNode(nodes: PipelineGraphNode[], id: string): PipelineGraphNode | undefined {
  return nodes.find((node) => node.id === id);
}

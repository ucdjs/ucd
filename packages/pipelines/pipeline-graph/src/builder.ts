import type { FileContext } from "@ucdjs/pipeline-core";
import type {
  PipelineGraph,
  PipelineGraphEdge,
  PipelineGraphNode,
} from "./types";

export class PipelineGraphBuilder {
  #nodes: Map<string, PipelineGraphNode> = new Map();
  #edges: PipelineGraphEdge[] = [];
  #edgeIndex: Set<string> = new Set();

  addSourceNode(version: string): string {
    const id = `source:${version}`;
    if (!this.#nodes.has(id)) {
      this.#nodes.set(id, { id, type: "source", version });
    }
    return id;
  }

  addFileNode(file: FileContext): string {
    const id = `file:${file.version}:${file.path}`;
    if (!this.#nodes.has(id)) {
      this.#nodes.set(id, { id, type: "file", file });
    }
    return id;
  }

  addRouteNode(routeId: string, version: string): string {
    const id = `route:${version}:${routeId}`;
    if (!this.#nodes.has(id)) {
      this.#nodes.set(id, { id, type: "route", routeId });
    }
    return id;
  }

  addOutputNode(
    outputIndex: number,
    version: string,
    property?: string,
    outputId?: string,
    locator?: string,
  ): string {
    const qualifiedId = outputId || locator
      ? `${outputId ?? "default"}:${locator ?? "unknown"}`
      : `${outputIndex}`;
    const id = `output:${version}:${qualifiedId}`;
    const existing = this.#nodes.get(id);
    if (existing?.type === "output") {
      this.#nodes.set(id, {
        ...existing,
        property: existing.property ?? property,
        outputId: existing.outputId ?? outputId,
        locator: existing.locator ?? locator,
      });
    } else if (!existing) {
      this.#nodes.set(id, { id, type: "output", outputIndex, property, outputId, locator });
    }
    return id;
  }

  addEdge(from: string, to: string, type: PipelineGraphEdge["type"]): void {
    const key = `${from}|${to}|${type}`;
    if (this.#edgeIndex.has(key)) return;
    this.#edgeIndex.add(key);
    this.#edges.push({ from, to, type });
  }

  build(): PipelineGraph {
    return {
      nodes: [...this.#nodes.values()],
      edges: [...this.#edges],
    };
  }

  clear(): void {
    this.#nodes.clear();
    this.#edges.length = 0;
    this.#edgeIndex.clear();
  }
}

export function createPipelineGraphBuilder(): PipelineGraphBuilder {
  return new PipelineGraphBuilder();
}

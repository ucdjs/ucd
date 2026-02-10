import type {
  FileContext,
  PipelineGraph,
  PipelineGraphEdge,
  PipelineGraphNode,
} from "@ucdjs/pipelines-core";

export interface GraphBuilderOptions {
  includeArtifacts?: boolean;
}

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

  addArtifactNode(artifactId: string, version: string): string {
    const id = `artifact:${version}:${artifactId}`;
    if (!this.#nodes.has(id)) {
      this.#nodes.set(id, { id, type: "artifact", artifactId });
    }
    return id;
  }

  addOutputNode(outputIndex: number, version: string, property?: string): string {
    const id = `output:${version}:${outputIndex}`;
    if (!this.#nodes.has(id)) {
      this.#nodes.set(id, { id, type: "output", outputIndex, property });
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
      nodes: Array.from(this.#nodes.values()),
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

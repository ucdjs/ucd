import type { PipelineGraph } from "@ucdjs/pipelines-core";
import type { PipelineTraceRecord } from "./traces";
import { PipelineGraphBuilder } from "@ucdjs/pipelines-graph";

export function buildExecutionGraphFromTraces(
  traces: readonly PipelineTraceRecord[],
): PipelineGraph {
  const builder = new PipelineGraphBuilder();
  const producedOutputs = new Map<string, { routeId: string; version: string; property?: string }>();
  const resolvedProducedOutputs = new Set<string>();

  for (const trace of traces) {
    switch (trace.kind) {
      case "source.provided": {
        const sourceNodeId = builder.addSourceNode(trace.version);
        if (trace.file) {
          const fileNodeId = builder.addFileNode(trace.file);
          builder.addEdge(sourceNodeId, fileNodeId, "provides");
        } else if (trace.artifactId) {
          const artifactNodeId = builder.addArtifactNode(trace.artifactId, trace.version);
          builder.addEdge(sourceNodeId, artifactNodeId, "provides");
        }
        break;
      }
      case "file.matched": {
        const fileNodeId = builder.addFileNode(trace.file);
        const routeNodeId = builder.addRouteNode(trace.routeId, trace.version);
        builder.addEdge(fileNodeId, routeNodeId, "matched");
        break;
      }
      case "output.produced": {
        producedOutputs.set(`${trace.routeId}:${trace.outputIndex}`, {
          routeId: trace.routeId,
          version: trace.version,
          property: trace.property,
        });
        break;
      }
      case "output.resolved": {
        resolvedProducedOutputs.add(`${trace.routeId}:${trace.outputIndex}`);
        const routeNodeId = builder.addRouteNode(trace.routeId, trace.version);
        const outputNodeId = builder.addOutputNode(
          trace.outputIndex,
          trace.version,
          trace.property,
          trace.outputId,
          trace.locator,
        );
        builder.addEdge(routeNodeId, outputNodeId, "resolved");
        break;
      }
      case "output.written": {
        builder.addOutputNode(
          trace.outputIndex,
          trace.version,
          trace.property,
          trace.outputId,
          trace.locator,
        );
        break;
      }
      case "file.fallback": {
        builder.addFileNode(trace.file);
        break;
      }
      case "artifact.emitted": {
        const routeNodeId = builder.addRouteNode(trace.routeId, trace.version);
        const artifactNodeId = builder.addArtifactNode(trace.artifactId, trace.version);
        builder.addEdge(routeNodeId, artifactNodeId, "resolved");
        break;
      }
      case "artifact.consumed": {
        const artifactNodeId = builder.addArtifactNode(trace.artifactId, trace.version);
        const routeNodeId = builder.addRouteNode(trace.routeId, trace.version);
        builder.addEdge(artifactNodeId, routeNodeId, "uses-artifact");
        break;
      }
      default:
        break;
    }
  }

  for (const [key, output] of producedOutputs.entries()) {
    if (resolvedProducedOutputs.has(key)) {
      continue;
    }

    const [, outputIndexText] = key.split(":");
    const outputIndex = Number.parseInt(outputIndexText ?? "", 10);
    const routeNodeId = builder.addRouteNode(output.routeId, output.version);
    const outputNodeId = builder.addOutputNode(outputIndex, output.version, output.property);
    builder.addEdge(routeNodeId, outputNodeId, "resolved");
  }

  return builder.build();
}

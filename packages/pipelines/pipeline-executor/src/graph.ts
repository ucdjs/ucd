import type { PipelineGraph } from "@ucdjs/pipelines-graph";
import type { PipelineTraceRecord } from "@ucdjs/pipelines-core/tracing";
import { PipelineGraphBuilder } from "@ucdjs/pipelines-graph";

export function buildExecutionGraphFromTraces(
  traces: readonly PipelineTraceRecord[],
): PipelineGraph {
  const builder = new PipelineGraphBuilder();
  const producedOutputs = new Map<string, { routeId: string; version: string; outputIndex: number; property?: string }>();
  const resolvedProducedOutputs = new Set<string>();

  for (const trace of traces) {
    switch (trace.kind) {
      case "source.provided": {
        const sourceNodeId = builder.addSourceNode(trace.version);
        if (trace.file) {
          const fileNodeId = builder.addFileNode(trace.file);
          builder.addEdge(sourceNodeId, fileNodeId, "provides");
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
        producedOutputs.set(`${trace.version}:${trace.routeId}:${trace.outputIndex}`, {
          routeId: trace.routeId,
          version: trace.version,
          outputIndex: trace.outputIndex,
          property: trace.property,
        });
        break;
      }
      case "output": {
        resolvedProducedOutputs.add(`${trace.version}:${trace.routeId}:${trace.outputIndex}`);
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
      default:
        break;
    }
  }

  for (const [key, output] of producedOutputs.entries()) {
    if (resolvedProducedOutputs.has(key)) {
      continue;
    }

    const routeNodeId = builder.addRouteNode(output.routeId, output.version);
    const outputNodeId = builder.addOutputNode(output.outputIndex, output.version, output.property);
    builder.addEdge(routeNodeId, outputNodeId, "resolved");
  }

  return builder.build();
}

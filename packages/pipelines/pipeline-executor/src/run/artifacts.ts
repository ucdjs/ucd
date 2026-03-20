import type { PipelineArtifactDefinition } from "@ucdjs/pipelines-artifacts";
import type { FileContext, ParsedRow, PipelineError, PipelineLogger } from "@ucdjs/pipelines-core";
import type { EventEmitter } from "../internal/events";
import type { PipelineExecutionRuntime } from "../runtime";
import type { SourceAdapter } from "./source-files";
import type { PipelineTraceEmitInput, PipelineTraceRecord } from "./traces";
import { createParseContext } from "./source-files";

export interface GlobalArtifactState {
  artifactsMap: Record<string, unknown>;
  listFiles: () => Promise<FileContext[]>;
}

interface RunGlobalArtifactsOptions {
  artifacts: PipelineArtifactDefinition[];
  version: string;
  state: GlobalArtifactState;
  logger: PipelineLogger;
  source: SourceAdapter;
  runtime: PipelineExecutionRuntime;
  events: EventEmitter;
  emitTrace: (trace: PipelineTraceEmitInput) => Promise<PipelineTraceRecord>;
  onError: (spanId: string, error: PipelineError) => Promise<void>;
}

export async function runGlobalArtifacts(options: RunGlobalArtifactsOptions): Promise<void> {
  const { artifacts, version, state, logger, source, runtime, events, emitTrace, onError } = options;

  for (const artifact of artifacts) {
    const startTime = performance.now();
    const spanId = events.nextSpanId();

    await runtime.withSpan(spanId, () => events.emit({
      type: "artifact:start",
      artifactId: artifact.id,
      version,
      spanId,
      timestamp: performance.now(),
    }));
    await runtime.withSpan(spanId, () => emitTrace({ kind: "source.provided", version, artifactId: artifact.id }));

    try {
      let rows: AsyncIterable<ParsedRow> | undefined;
      if (artifact.filter && artifact.parser) {
        const file = (await state.listFiles()).find((candidate) => artifact.filter!({ file: candidate, logger }));
        if (file) {
          rows = artifact.parser(createParseContext(file, source, runtime));
        }
      }
      state.artifactsMap[artifact.id] = await artifact.build({ version, logger }, rows);
    } catch (error) {
      await onError(spanId, {
        scope: "artifact",
        message: error instanceof Error ? error.message : String(error),
        error,
        artifactId: artifact.id,
        version,
      });
    }

    await runtime.withSpan(spanId, () => events.emit({
      type: "artifact:end",
      artifactId: artifact.id,
      version,
      durationMs: performance.now() - startTime,
      spanId,
      timestamp: performance.now(),
    }));
  }
}

export async function traceRouteArtifacts(options: {
  emitTrace: (trace: PipelineTraceEmitInput) => Promise<PipelineTraceRecord>;
  version: string;
  routeId: string;
  consumedArtifactIds: string[];
  emittedArtifacts: Record<string, unknown>;
}): Promise<void> {
  const { emitTrace, version, routeId, consumedArtifactIds, emittedArtifacts } = options;

  for (const artifactId of consumedArtifactIds) {
    await emitTrace({ kind: "artifact.consumed", routeId, artifactId, version });
  }

  for (const artifactName of Object.keys(emittedArtifacts)) {
    await emitTrace({ kind: "artifact.emitted", routeId, artifactId: `${routeId}:${artifactName}`, version });
  }
}

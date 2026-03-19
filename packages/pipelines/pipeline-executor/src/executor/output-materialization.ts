import type { FileContext, NormalizedRouteOutputDefinition } from "@ucdjs/pipelines-core";
import type { PipelineRunContext } from "./run-pipeline-types";
import {
  getOutputProperty,
  resolveOutputDestination,
  writeOutputToSink,
} from "../outputs";

const DEFAULT_FALLBACK_OUTPUTS: readonly NormalizedRouteOutputDefinition[] = [{
  id: "fallback-output",
  format: "json",
}];

interface MaterializeOutputsOptions {
  context: PipelineRunContext;
  version: string;
  routeId: string;
  file: FileContext;
  values: readonly unknown[];
  spanId?: string;
  routeOutputs?: readonly NormalizedRouteOutputDefinition[];
}

export async function materializeOutputs(options: MaterializeOutputsOptions): Promise<void> {
  const {
    context,
    version,
    routeId,
    file,
    values,
    spanId,
  } = options;

  const emitTrace = <TTrace extends Parameters<PipelineRunContext["emitTrace"]>[0]>(trace: TTrace) => {
    if (spanId) {
      return context.emitTraceWithSpan(spanId, trace);
    }

    return context.emitTrace(trace);
  };

  const routeOutputs = options.routeOutputs
    ?? context.routeOutputDefinitions.get(routeId)
    ?? DEFAULT_FALLBACK_OUTPUTS;

  for (const output of values) {
    const outputIndex = context.outputs.length;
    context.outputs.push(output);

    const property = getOutputProperty(output);
    await emitTrace({
      kind: "output.produced",
      version,
      routeId,
      file,
      outputIndex,
      property,
    });

    for (const definition of routeOutputs) {
      const destination = resolveOutputDestination(definition, {
        version,
        routeId,
        file,
        output,
        property,
        outputIndex,
      });

      await emitTrace({
        kind: "output.resolved",
        version,
        routeId,
        file,
        outputIndex,
        outputId: definition.id,
        property,
        sink: definition.sink?.type ?? "memory",
        format: definition.format,
        locator: destination.displayLocator,
      });

      try {
        await writeOutputToSink(
          definition.sink,
          destination.locator,
          output,
          definition.format,
        );

        await emitTrace({
          kind: "output.written",
          version,
          routeId,
          file,
          outputIndex,
          outputId: definition.id,
          property,
          sink: definition.sink?.type ?? "memory",
          locator: destination.displayLocator,
          status: "written",
        });
      } catch (error) {
        await emitTrace({
          kind: "output.written",
          version,
          routeId,
          file,
          outputIndex,
          outputId: definition.id,
          property,
          sink: definition.sink?.type ?? "memory",
          locator: destination.displayLocator,
          status: "failed",
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    }
  }
}

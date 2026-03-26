import type {
  FileContext,
  NormalizedRouteOutputDefinition,
  OutputSinkDefinition,
} from "@ucdjs/pipelines-core";
import type { ResolvedOutputDestination } from "@ucdjs/pipelines-core/outputs";
import type { PipelineExecutionRuntime } from "../runtime";
import {
  getOutputProperty,
  resolveOutputDestination,
  serializeOutputValue,
} from "@ucdjs/pipelines-core/outputs";

export type { ResolvedOutputDestination } from "@ucdjs/pipelines-core/outputs";
export { DEFAULT_FALLBACK_OUTPUTS, getOutputProperty, renderOutputPathTemplate, resolveOutputDestination, serializeOutputValue } from "@ucdjs/pipelines-core/outputs";

export async function writeOutputToSink(
  sink: OutputSinkDefinition | undefined,
  locator: string,
  value: unknown,
  format: "json" | "text",
  runtime?: PipelineExecutionRuntime,
): Promise<void> {
  if (!sink) {
    return;
  }

  if (!runtime?.writeOutput) {
    throw new Error(`Output sink "${sink.type}" is configured, but this runtime does not support output writes.`);
  }

  const content = serializeOutputValue(value, format);
  await runtime.writeOutput(locator, content);
}

export interface PublishedOutputFile {
  file: FileContext;
  content: string;
  publishedBy: {
    pipelineId: string;
    outputId: string;
  };
}

type OutputTraceInput = Extract<
  | {
    kind: "output.produced";
    version: string;
    routeId: string;
    file: FileContext;
    outputIndex: number;
    property?: string;
  }
  | {
    kind: "output.resolved";
    version: string;
    routeId: string;
    file: FileContext;
    outputIndex: number;
    outputId: string;
    property?: string;
    sink: string;
    format: "json" | "text";
    locator: string;
  }
  | {
    kind: "output.written";
    version: string;
    routeId: string;
    file: FileContext;
    outputIndex: number;
    outputId: string;
    property?: string;
    sink: string;
    locator: string;
    status: "written" | "failed";
    error?: string;
  },
  { kind: "output.produced" | "output.resolved" | "output.written" }
>;

export async function materializeOutputs(options: {
  outputs: unknown[];
  version: string;
  routeId: string;
  file: FileContext;
  values: readonly unknown[];
  emitTrace: (trace: OutputTraceInput) => Promise<unknown>;
  definitions: readonly NormalizedRouteOutputDefinition[];
  runtime?: PipelineExecutionRuntime;
}): Promise<void> {
  const { outputs, version, routeId, file, values, emitTrace, definitions, runtime } = options;

  for (const output of values) {
    const outputIndex = outputs.length;
    const property = getOutputProperty(output);
    outputs.push(output);

    await emitTrace({ kind: "output.produced", version, routeId, file, outputIndex, property });
    for (const definition of definitions) {
      const destination: ResolvedOutputDestination = resolveOutputDestination(definition, { version, routeId, file, output, property, outputIndex }, runtime?.resolvePath);
      const traceBase = {
        version,
        routeId,
        file,
        outputIndex,
        outputId: definition.id,
        property,
        sink: definition.sink?.type ?? "memory",
        locator: destination.displayLocator,
      };

      await emitTrace({ kind: "output.resolved", ...traceBase, format: definition.format });
      try {
        await writeOutputToSink(definition.sink, destination.locator, output, definition.format, runtime);
        await emitTrace({ kind: "output.written", ...traceBase, status: "written" });
      } catch (error) {
        await emitTrace({
          kind: "output.written",
          ...traceBase,
          status: "failed",
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    }
  }
}

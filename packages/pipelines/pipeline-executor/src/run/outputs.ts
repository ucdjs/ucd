import type {
  FileContext,
  NormalizedRouteOutputDefinition,
  OutputSinkDefinition,
} from "@ucdjs/pipeline-core";
import type { ResolvedOutputDestination } from "@ucdjs/pipeline-core/outputs";
import type { PipelineOutputManifestEntry } from "@ucdjs/pipeline-core/tracing";
import type { PipelineExecutionRuntime } from "../runtime";
import { trace } from "@opentelemetry/api";
import {
  getOutputProperty,
  resolveOutputDestination,
  serializeOutputValue,
} from "@ucdjs/pipeline-core/outputs";

export type { ResolvedOutputDestination } from "@ucdjs/pipeline-core/outputs";
export { DEFAULT_FALLBACK_OUTPUTS, getOutputProperty, renderOutputPathTemplate, resolveOutputDestination, serializeOutputValue } from "@ucdjs/pipeline-core/outputs";

export async function writeOutputToSink(
  sink: OutputSinkDefinition | undefined,
  locator: string,
  value: unknown,
  format: "json" | "text",
  runtime: PipelineExecutionRuntime,
): Promise<void> {
  if (!sink) {
    return;
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

export interface MaterializeOutputsResult {
  entries: PipelineOutputManifestEntry[];
  /** Write errors that occurred -callers should push these to their error collections. */
  writeErrors: Array<{ error: unknown; outputId: string; routeId: string }>;
}

export async function materializeOutputs(options: {
  outputs: unknown[];
  version: string;
  routeId: string;
  file: FileContext;
  values: readonly unknown[];
  definitions: readonly NormalizedRouteOutputDefinition[];
  runtime: PipelineExecutionRuntime;
  pipelineId: string;
}): Promise<MaterializeOutputsResult> {
  const { outputs, version, routeId, file, values, definitions, runtime, pipelineId } = options;
  const manifestEntries: PipelineOutputManifestEntry[] = [];
  const writeErrors: MaterializeOutputsResult["writeErrors"] = [];

  // Capture the active file.route span to add output.produced events
  const fileRouteSpan = trace.getActiveSpan();

  for (const output of values) {
    const outputIndex = outputs.length;
    const property = getOutputProperty(output);
    outputs.push(output);

    fileRouteSpan?.addEvent("output.produced", {
      "pipeline.id": pipelineId,
      "pipeline.version": version,
      "route.id": routeId,
      "file.path": file.path,
      "file.name": file.name,
      "output.index": outputIndex,
      "output.property": property ?? "",
    });

    for (const definition of definitions) {
      const destination: ResolvedOutputDestination = resolveOutputDestination(
        definition,
        { version, routeId, file, output, property, outputIndex },
        runtime.resolvePath.bind(runtime),
      );

      const outputId = definition.id;
      const sink = definition.sink?.type ?? "memory";
      const locator = destination.displayLocator;

      await runtime.startSpan("output", async (outputSpan) => {
        outputSpan.setAttributes({
          "pipeline.id": pipelineId,
          "pipeline.version": version,
          "route.id": routeId,
          "file.path": file.path,
          "file.name": file.name,
          "file.dir": file.dir,
          "file.ext": file.ext,
          "file.version": file.version,
          "output.index": outputIndex,
          "output.id": outputId,
          "output.property": property ?? "",
          "output.sink": sink,
          "output.format": definition.format,
          "output.locator": locator,
        });

        try {
          await writeOutputToSink(definition.sink, destination.locator, output, definition.format, runtime);
          outputSpan.setAttribute("output.status", "written");
          outputSpan.addEvent("output.written", {
            "pipeline.id": pipelineId,
            "pipeline.version": version,
            "route.id": routeId,
            "file.path": file.path,
            "file.name": file.name,
            "file.dir": file.dir,
            "file.ext": file.ext,
            "file.version": file.version,
            "output.index": outputIndex,
            "output.id": outputId,
            "output.property": property ?? "",
            "output.sink": sink,
            "output.locator": locator,
            "output.status": "written",
          });
          manifestEntries.push({
            outputIndex,
            outputId,
            routeId,
            pipelineId,
            version,
            property,
            sink,
            format: definition.format,
            locator,
            status: "written",
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          outputSpan.setAttribute("output.status", "failed");
          outputSpan.addEvent("output.written", {
            "pipeline.id": pipelineId,
            "pipeline.version": version,
            "route.id": routeId,
            "file.path": file.path,
            "file.name": file.name,
            "file.dir": file.dir,
            "file.ext": file.ext,
            "file.version": file.version,
            "output.index": outputIndex,
            "output.id": outputId,
            "output.property": property ?? "",
            "output.sink": sink,
            "output.locator": locator,
            "output.status": "failed",
            "output.error": errorMessage,
          });
          manifestEntries.push({
            outputIndex,
            outputId,
            routeId,
            pipelineId,
            version,
            property,
            sink,
            format: definition.format,
            locator,
            status: "failed",
            error: errorMessage,
          });
          writeErrors.push({ error, outputId, routeId });
        }
      });
    }
  }

  return { entries: manifestEntries, writeErrors };
}

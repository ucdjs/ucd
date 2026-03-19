import type { PipelineRouteDefinition } from "./route";
import type { FileContext, PropertyJson } from "./types";

export interface MemoryOutputSinkDefinition {
  type: "memory";
}

export interface FilesystemOutputSinkDefinition {
  type: "filesystem";
  baseDir?: string;
}

export type OutputSinkDefinition = MemoryOutputSinkDefinition | FilesystemOutputSinkDefinition;

export interface RouteOutputPathContext {
  version: string;
  routeId: string;
  file: FileContext;
  output: unknown;
  property?: string;
  outputIndex: number;
}

export type RouteOutputPathResolver = (ctx: RouteOutputPathContext) => string;

export interface RouteOutputDefinition {
  /**
   * Stable identifier for this output destination within the route.
   */
  id?: string;

  /**
   * Destination sink to use when the output should be persisted.
   * @default memory sink
   */
  sink?: OutputSinkDefinition;

  /**
   * Output format used by built-in sinks.
   * @default "json"
   */
  format?: "json" | "text";

  /**
   * Preferred explicit path for the output.
   */
  path?: string | RouteOutputPathResolver;

  /**
   * Legacy directory field.
   */
  dir?: string;

  /**
   * Legacy file name generator.
   */
  fileName?: string | ((pj: PropertyJson) => string);
}

export function memorySink(): MemoryOutputSinkDefinition {
  return { type: "memory" };
}

export function filesystemSink(options: Omit<FilesystemOutputSinkDefinition, "type"> = {}): FilesystemOutputSinkDefinition {
  return {
    type: "filesystem",
    ...options,
  };
}

export interface NormalizedRouteOutputDefinition {
  id: string;
  sink: OutputSinkDefinition;
  format: "json" | "text";
  path?: RouteOutputDefinition["path"];
  dir?: string;
  fileName?: RouteOutputDefinition["fileName"];
}

export function normalizeRouteOutputs(route: PipelineRouteDefinition): NormalizedRouteOutputDefinition[] {
  const rawOutputs = route.outputs?.length
    ? route.outputs
    : route.out
      ? [route.out]
      : [{ id: "default", sink: memorySink() }];

  return rawOutputs.map((output, index) => {
    const sink = output.sink ?? memorySink();

    return {
      id: output.id ?? `output-${index + 1}`,
      sink,
      format: output.format ?? "json",
      path: output.path,
      dir: output.dir,
      fileName: output.fileName,
    };
  });
}

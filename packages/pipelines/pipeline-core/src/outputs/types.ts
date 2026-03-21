import type { PipelineRouteDefinition } from "../route";
import type { FileContext } from "../types";

export interface FilesystemOutputSinkDefinition {
  type: "filesystem";
  baseDir?: string;
}

export type OutputSinkDefinition = FilesystemOutputSinkDefinition;

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
   * When omitted, the output remains available for the run only.
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
}

export function filesystemSink(options: Omit<FilesystemOutputSinkDefinition, "type"> = {}): FilesystemOutputSinkDefinition {
  return {
    type: "filesystem",
    ...options,
  };
}

export interface NormalizedRouteOutputDefinition {
  id: string;
  sink?: OutputSinkDefinition;
  format: "json" | "text";
  path?: RouteOutputDefinition["path"];
}

export function normalizeRouteOutputs(route: PipelineRouteDefinition): NormalizedRouteOutputDefinition[] {
  const rawOutputs = route.outputs?.length
    ? route.outputs
    : [{ id: "default" }];

  return rawOutputs.map((output, index) => {
    return {
      id: output.id ?? `output-${index + 1}`,
      sink: output.sink,
      format: output.format ?? "json",
      path: output.path,
    };
  });
}

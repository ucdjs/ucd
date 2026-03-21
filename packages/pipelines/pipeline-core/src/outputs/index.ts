export type {
  ResolvedOutputDestination,
} from "./resolve";

export {
  DEFAULT_FALLBACK_OUTPUTS,
  getOutputProperty,
  propertyToKebab,
  renderOutputPathTemplate,
  resolveOutputDestination,
} from "./resolve";

export {
  serializeOutputValue,
} from "./serialize";

export type {
  FilesystemOutputSinkDefinition,
  NormalizedRouteOutputDefinition,
  OutputSinkDefinition,
  RouteOutputDefinition,
  RouteOutputPathContext,
  RouteOutputPathResolver,
} from "./types";

export {
  filesystemSink,
  normalizeRouteOutputs,
} from "./types";

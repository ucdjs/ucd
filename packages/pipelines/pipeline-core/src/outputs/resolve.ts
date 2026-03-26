import type { NormalizedRouteOutputDefinition, OutputSinkDefinition, RouteOutputPathContext } from "./types";

export interface ResolvedOutputDestination {
  locator: string;
  displayLocator: string;
}

export const DEFAULT_FALLBACK_OUTPUTS: readonly NormalizedRouteOutputDefinition[] = [{
  id: "fallback-output",
  format: "json",
}];

const UNDERSCORE_RE = /_/g;
const NON_WORD_RE = /[^a-z0-9]+/g;
const LEADING_SLASHES_RE = /^\/+/;
const TEMPLATE_TOKEN_RE = /\{([^{}]+)\}/g;

export function getOutputProperty(output: unknown): string | undefined {
  if (typeof output !== "object" || output == null) {
    return undefined;
  }

  if ("property" in output && typeof output.property === "string") {
    return output.property;
  }

  return undefined;
}

export function resolveOutputDestination(
  definition: NormalizedRouteOutputDefinition,
  ctx: RouteOutputPathContext,
  resolvePath?: (base: string, relative: string) => string,
): ResolvedOutputDestination {
  if (definition.path) {
    const relativeLocator = typeof definition.path === "function"
      ? definition.path(ctx)
      : renderOutputPathTemplate(definition.path, ctx);

    return createDestination(definition.sink, relativeLocator, resolvePath);
  }

  const property = ctx.property ?? "output";
  const defaultRelative = `${ctx.routeId}/${propertyToKebab(property)}-${ctx.outputIndex}.${definition.format === "text" ? "txt" : "json"}`;
  return createDestination(definition.sink, defaultRelative, resolvePath);
}

function createDestination(
  sink: OutputSinkDefinition | undefined,
  relativeLocator: string,
  resolvePath?: (base: string, relative: string) => string,
): ResolvedOutputDestination {
  const normalizedRelative = relativeLocator.replaceAll("\\", "/");

  if (
    normalizedRelative.startsWith("/")
    || normalizedRelative.split("/").includes("..")
  ) {
    throw new Error(`Output path must stay within the configured sink: "${relativeLocator}"`);
  }

  if (sink?.type === "filesystem") {
    const resolved = sink.baseDir
      ? resolvePath?.(sink.baseDir, normalizedRelative) ?? `${sink.baseDir}/${normalizedRelative}`
      : resolvePath?.("", normalizedRelative) ?? normalizedRelative;

    return {
      locator: resolved,
      displayLocator: resolved,
    };
  }

  const stripped = normalizedRelative.replace(LEADING_SLASHES_RE, "");
  return {
    locator: `memory://${stripped}`,
    displayLocator: `memory://${stripped}`,
  };
}

export function renderOutputPathTemplate(template: string, ctx: RouteOutputPathContext): string {
  return template.replaceAll(TEMPLATE_TOKEN_RE, (_match, token) => {
    const [rawKey = "", transform] = String(token).split(":");
    const value = resolveTemplateValue(rawKey, ctx);
    if (value == null) {
      return "";
    }

    const stringValue = String(value);
    switch (transform) {
      case "lower":
        return stringValue.toLowerCase();
      case "kebab":
        return propertyToKebab(stringValue);
      default:
        return stringValue;
    }
  });
}

function resolveTemplateValue(key: string, ctx: RouteOutputPathContext): string | number | undefined {
  switch (key) {
    case "version":
      return ctx.version;
    case "routeId":
      return ctx.routeId;
    case "property":
      return ctx.property;
    case "outputIndex":
      return ctx.outputIndex;
    case "file.name":
      return ctx.file.name;
    case "file.path":
      return ctx.file.path;
    default:
      return undefined;
  }
}

export function propertyToKebab(value: string): string {
  const kebab = value
    .replace(UNDERSCORE_RE, "-")
    .toLowerCase()
    .replace(NON_WORD_RE, "-");

  let start = 0;
  while (start < kebab.length && kebab[start] === "-") start++;
  let end = kebab.length;
  while (end > start && kebab[end - 1] === "-") end--;
  return kebab.slice(start, end);
}

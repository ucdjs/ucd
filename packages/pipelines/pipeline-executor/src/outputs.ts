import type {
  FileContext,
  NormalizedRouteOutputDefinition,
  OutputSinkDefinition,
  PropertyJson,
  RouteOutputDefinition,
  RouteOutputPathContext,
} from "@ucdjs/pipelines-core";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export interface ResolvedOutputDestination {
  locator: string;
  displayLocator: string;
}

const UNDERSCORE_RE = /_/g;
const NON_WORD_RE = /[^a-z0-9]+/g;

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
): ResolvedOutputDestination {
  if (definition.path) {
    const relativeLocator = typeof definition.path === "function"
      ? definition.path(ctx)
      : renderOutputPathTemplate(definition.path, ctx);

    return createDestination(definition.sink, relativeLocator);
  }

  const legacyFileName = resolveLegacyFileName(definition.fileName, ctx.output, ctx.outputIndex);
  const legacyRelative = [definition.dir, legacyFileName]
    .filter((segment): segment is string => typeof segment === "string" && segment.length > 0)
    .join("/");

  if (legacyRelative) {
    return createDestination(definition.sink, legacyRelative);
  }

  const property = ctx.property ?? "output";
  const defaultRelative = `${ctx.routeId}/${propertyToKebab(property)}-${ctx.outputIndex}.${definition.format === "text" ? "txt" : "json"}`;
  return createDestination(definition.sink, defaultRelative);
}

function createDestination(sink: OutputSinkDefinition, relativeLocator: string): ResolvedOutputDestination {
  if (sink.type === "filesystem") {
    const resolved = sink.baseDir
      ? path.resolve(sink.baseDir, relativeLocator)
      : path.resolve(relativeLocator);

    return {
      locator: resolved,
      displayLocator: resolved,
    };
  }

  const normalized = relativeLocator.replace(/^\/+/, "");
  return {
    locator: `memory://${normalized}`,
    displayLocator: `memory://${normalized}`,
  };
}

function resolveLegacyFileName(
  fileName: RouteOutputDefinition["fileName"],
  output: unknown,
  outputIndex: number,
): string | undefined {
  if (typeof fileName === "string") {
    return fileName;
  }

  if (typeof fileName === "function" && isPropertyJson(output)) {
    return fileName(output);
  }

  if (isPropertyJson(output) && output.property) {
    return `${output.property}.json`;
  }

  return `output-${outputIndex}.json`;
}

function isPropertyJson(value: unknown): value is PropertyJson {
  return typeof value === "object" && value !== null && "version" in value && "entries" in value;
}

export async function writeOutputToSink(
  sink: OutputSinkDefinition,
  locator: string,
  value: unknown,
  format: "json" | "text",
): Promise<void> {
  if (sink.type === "memory") {
    return;
  }

  const content = serializeOutputValue(value, format);
  await mkdir(path.dirname(locator), { recursive: true });
  await writeFile(locator, content, "utf8");
}

export function serializeOutputValue(value: unknown, format: "json" | "text"): string {
  if (format === "text") {
    return typeof value === "string" ? value : JSON.stringify(value, null, 2);
  }

  return JSON.stringify(value, null, 2);
}

export function renderOutputPathTemplate(template: string, ctx: RouteOutputPathContext): string {
  return template.replaceAll(/\{([^}]+)\}/g, (_match, token) => {
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

function propertyToKebab(value: string): string {
  return value
    .replace(UNDERSCORE_RE, "-")
    .toLowerCase()
    .replace(NON_WORD_RE, "-")
    .replace(/^-+|-+$/g, "");
}

export interface PublishedOutputFile {
  file: FileContext;
  content: string;
  publishedBy: {
    pipelineId: string;
    outputId: string;
  };
}

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

function createDestination(sink: OutputSinkDefinition | undefined, relativeLocator: string): ResolvedOutputDestination {
  if (sink?.type === "filesystem") {
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
  sink: OutputSinkDefinition | undefined,
  locator: string,
  value: unknown,
  format: "json" | "text",
): Promise<void> {
  if (!sink) {
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
}): Promise<void> {
  const { outputs, version, routeId, file, values, emitTrace, definitions } = options;

  for (const output of values) {
    const outputIndex = outputs.length;
    const property = getOutputProperty(output);
    outputs.push(output);

    await emitTrace({ kind: "output.produced", version, routeId, file, outputIndex, property });
    for (const definition of definitions) {
      const destination = resolveOutputDestination(definition, { version, routeId, file, output, property, outputIndex });
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
        await writeOutputToSink(definition.sink, destination.locator, output, definition.format);
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

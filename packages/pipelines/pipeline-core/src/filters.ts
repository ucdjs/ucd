import type { FileContext, PipelineFilter } from "./types";
import picomatch from "picomatch";

type FilterNode
  = | { type: "filter"; name: string; args: unknown[] }
    | { type: "and"; filters: PipelineFilter[] }
    | { type: "or"; filters: PipelineFilter[] }
    | { type: "not"; filter: PipelineFilter };

export const FILTER_NODE: symbol = Symbol.for("ucdjs.filter-node");

export function createPipelineFilter(
  caller: { name: string },
  args: unknown[],
  fn: PipelineFilter,
): PipelineFilter {
  (fn as any)[FILTER_NODE] = { type: "filter", name: caller.name, args };
  return fn;
}

function serializeNode(filter: PipelineFilter, insideCombinator = false): string {
  const node = (filter as any)[FILTER_NODE] as FilterNode | undefined;
  if (!node) return "<custom>";

  switch (node.type) {
    case "filter": {
      const args = node.args.map(formatArg).join(", ");
      return `${node.name}(${args})`;
    }
    case "and": {
      const desc = node.filters.map((f) => serializeNode(f, true)).join(" AND ");
      return insideCombinator ? `(${desc})` : desc;
    }
    case "or": {
      const desc = node.filters.map((f) => serializeNode(f, true)).join(" OR ");
      return insideCombinator ? `(${desc})` : desc;
    }
    case "not": {
      return `NOT ${serializeNode(node.filter, true)}`;
    }
  }
}

function formatArg(arg: unknown): string {
  if (typeof arg === "string") return `"${arg}"`;
  if (arg instanceof RegExp) return String(arg);
  if (Array.isArray(arg)) return JSON.stringify(arg);
  return String(arg);
}

export function getFilterDescription(filter: PipelineFilter): string | undefined {
  const node = (filter as any)[FILTER_NODE] as FilterNode | undefined;
  if (!node) return undefined;
  return serializeNode(filter);
}

export function byName(name: string): PipelineFilter {
  return createPipelineFilter(byName, [name], (ctx) => ctx.file.name === name);
}

export function byDir(dir: FileContext["dir"]): PipelineFilter {
  return createPipelineFilter(byDir, [dir], (ctx) => ctx.file.dir === dir);
}

export function byExt(ext: string): PipelineFilter {
  if (ext === "") {
    return createPipelineFilter(byExt, [""], (ctx) => ctx.file.ext === "");
  }
  const normalizedExt = ext.startsWith(".") ? ext : `.${ext}`;
  return createPipelineFilter(byExt, [normalizedExt], (ctx) => ctx.file.ext === normalizedExt);
}

export function byGlob(pattern: string): PipelineFilter {
  const matcher = picomatch(pattern);
  return createPipelineFilter(byGlob, [pattern], (ctx) => matcher(ctx.file.path));
}

export function byPath(pathPattern: string | RegExp): PipelineFilter {
  if (typeof pathPattern === "string") {
    return createPipelineFilter(byPath, [pathPattern], (ctx) => ctx.file.path === pathPattern);
  }
  return createPipelineFilter(byPath, [pathPattern], (ctx) => pathPattern.test(ctx.file.path));
}

export function byProp(pattern: string | RegExp): PipelineFilter {
  if (typeof pattern === "string") {
    return createPipelineFilter(byProp, [pattern], (ctx) => ctx.row?.property === pattern);
  }
  return createPipelineFilter(byProp, [pattern], (ctx) => !!ctx.row?.property && pattern.test(ctx.row.property));
}

export function bySource(sourceIds: string | string[]): PipelineFilter {
  const ids = Array.isArray(sourceIds) ? sourceIds : [sourceIds];
  return createPipelineFilter(bySource, [ids.length === 1 ? ids[0]! : ids], (ctx) => ctx.source != null && ids.includes(ctx.source.id));
}

export function and(...filters: PipelineFilter[]): PipelineFilter {
  const fn: PipelineFilter = (ctx) => filters.every((f) => f(ctx));
  (fn as any)[FILTER_NODE] = { type: "and", filters };
  return fn;
}

export function or(...filters: PipelineFilter[]): PipelineFilter {
  const fn: PipelineFilter = (ctx) => filters.some((f) => f(ctx));
  (fn as any)[FILTER_NODE] = { type: "or", filters };
  return fn;
}

export function not(filter: PipelineFilter): PipelineFilter {
  const fn: PipelineFilter = (ctx) => !filter(ctx);
  (fn as any)[FILTER_NODE] = { type: "not", filter };
  return fn;
}

export function always(): PipelineFilter {
  return createPipelineFilter(always, [], () => true);
}

export function never(): PipelineFilter {
  return createPipelineFilter(never, [], () => false);
}

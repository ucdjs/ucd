import type { FileContext, PipelineFilter } from "./types";
import picomatch from "picomatch";

export function byName(name: string): PipelineFilter {
  return (ctx) => ctx.file.name === name;
}

export function byDir(dir: FileContext["dir"]): PipelineFilter {
  return (ctx) => ctx.file.dir === dir;
}

export function byExt(ext: string): PipelineFilter {
  if (ext === "") {
    return (ctx) => ctx.file.ext === "";
  }
  const normalizedExt = ext.startsWith(".") ? ext : `.${ext}`;
  return (ctx) => ctx.file.ext === normalizedExt;
}

export function byGlob(pattern: string): PipelineFilter {
  const matcher = picomatch(pattern);
  return (ctx) => matcher(ctx.file.path);
}

export function byPath(pathPattern: string | RegExp): PipelineFilter {
  if (typeof pathPattern === "string") {
    return (ctx) => ctx.file.path === pathPattern;
  }
  return (ctx) => pathPattern.test(ctx.file.path);
}

export function byProp(pattern: string | RegExp): PipelineFilter {
  if (typeof pattern === "string") {
    return (ctx) => ctx.row?.property === pattern;
  }
  return (ctx) => !!ctx.row?.property && pattern.test(ctx.row.property);
}

export function bySource(sourceIds: string | string[]): PipelineFilter {
  const ids = Array.isArray(sourceIds) ? sourceIds : [sourceIds];
  return (ctx) => ctx.source != null && ids.includes(ctx.source.id);
}

export function and(...filters: PipelineFilter[]): PipelineFilter {
  return (ctx) => filters.every((f) => f(ctx));
}

export function or(...filters: PipelineFilter[]): PipelineFilter {
  return (ctx) => filters.some((f) => f(ctx));
}

export function not(filter: PipelineFilter): PipelineFilter {
  return (ctx) => !filter(ctx);
}

export function always(): PipelineFilter {
  return () => true;
}

export function never(): PipelineFilter {
  return () => false;
}

import type { FileContext, PipelineFilter } from "./types";
import picomatch from "picomatch";

type FilterNode
  = | {
    type: "filter";
    name: string;
    args: readonly unknown[];
  }
  | {
    type: "and";
    filters: readonly PipelineFilter[];
  }
  | {
    type: "or";
    filters: readonly PipelineFilter[];
  }
  | {
    type: "not";
    filter: PipelineFilter;
  };

export const FILTER_NODE: unique symbol = Symbol.for("ucdjs.filter-node") as typeof FILTER_NODE;

type FilterWithNode = PipelineFilter & {
  [FILTER_NODE]?: FilterNode;
};

function setFilterNode(filter: PipelineFilter, node: FilterNode): PipelineFilter {
  Object.defineProperty(filter, FILTER_NODE, {
    value: node,
    enumerable: false,
    configurable: false,
    writable: false,
  });

  return filter;
}

function getFilterNode(filter: PipelineFilter): FilterNode | undefined {
  return (filter as FilterWithNode)[FILTER_NODE];
}

export function createPipelineFilter(
  caller: { name: string },
  args: readonly unknown[],
  filter: PipelineFilter,
): PipelineFilter {
  return setFilterNode(filter, {
    type: "filter",
    name: caller.name,
    args,
  });
}

function serializeNode(filter: PipelineFilter, insideCombinator = false): string {
  const node = getFilterNode(filter);

  if (!node) {
    return "<custom>";
  }

  switch (node.type) {
    case "filter": {
      const args = node.args.map(formatArg).join(", ");
      return `${node.name}(${args})`;
    }

    case "and": {
      const description = node.filters.map((filter) => serializeNode(filter, true)).join(" AND ");
      return insideCombinator ? `(${description})` : description;
    }

    case "or": {
      const description = node.filters.map((filter) => serializeNode(filter, true)).join(" OR ");
      return insideCombinator ? `(${description})` : description;
    }

    case "not":
      return `NOT ${serializeNode(node.filter, true)}`;
  }
}

function formatArg(arg: unknown): string {
  if (typeof arg === "string") {
    return JSON.stringify(arg);
  }

  if (arg instanceof RegExp) {
    return String(arg);
  }

  if (Array.isArray(arg)) {
    return JSON.stringify(arg);
  }

  return String(arg);
}

export function getFilterDescription(filter: PipelineFilter): string | undefined {
  if (!getFilterNode(filter)) {
    return undefined;
  }

  return serializeNode(filter);
}

export function byName(name: string): PipelineFilter {
  return createPipelineFilter(byName, [name], (context) => context.file.name === name);
}

export function byDir(dir: FileContext["dir"]): PipelineFilter {
  return createPipelineFilter(byDir, [dir], (context) => context.file.dir === dir);
}

export function byExt(ext: string): PipelineFilter {
  const normalizedExt = ext === "" ? "" : ext.startsWith(".") ? ext : `.${ext}`;

  return createPipelineFilter(
    byExt,
    [normalizedExt],
    (context) => context.file.ext === normalizedExt,
  );
}

export function byGlob(pattern: string): PipelineFilter {
  const matches = picomatch(pattern);

  return createPipelineFilter(
    byGlob,
    [pattern],
    (context) => matches(context.file.path),
  );
}

export function byPath(pathPattern: string | RegExp): PipelineFilter {
  if (typeof pathPattern === "string") {
    return createPipelineFilter(
      byPath,
      [pathPattern],
      (context) => context.file.path === pathPattern,
    );
  }

  return createPipelineFilter(
    byPath,
    [pathPattern],
    (context) => pathPattern.test(context.file.path),
  );
}

export function byProp(pattern: string | RegExp): PipelineFilter {
  if (typeof pattern === "string") {
    return createPipelineFilter(
      byProp,
      [pattern],
      (context) => context.row?.property === pattern,
    );
  }

  return createPipelineFilter(
    byProp,
    [pattern],
    (context) => {
      const property = context.row?.property;
      return property != null && pattern.test(property);
    },
  );
}

export function bySource(sourceIds: string | readonly string[]): PipelineFilter {
  const ids = Array.isArray(sourceIds) ? sourceIds : [sourceIds];
  const serializedArg = ids.length === 1 ? ids[0] : ids;

  return createPipelineFilter(
    bySource,
    [serializedArg],
    (context) => context.source != null && ids.includes(context.source.id),
  );
}

export function and(...filters: PipelineFilter[]): PipelineFilter {
  return setFilterNode(
    (context) => filters.every((filter) => filter(context)),
    { type: "and", filters },
  );
}

export function or(...filters: PipelineFilter[]): PipelineFilter {
  return setFilterNode(
    (context) => filters.some((filter) => filter(context)),
    { type: "or", filters },
  );
}

export function not(filter: PipelineFilter): PipelineFilter {
  return setFilterNode(
    (context) => !filter(context),
    { type: "not", filter },
  );
}

export function always(): PipelineFilter {
  return createPipelineFilter(always, [], () => true);
}

export function never(): PipelineFilter {
  return createPipelineFilter(never, [], () => false);
}

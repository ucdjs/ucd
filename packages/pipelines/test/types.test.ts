import { describe, expectTypeOf, it } from "vitest";
import type {
  InferArtifactId,
  InferArtifactsMap,
  InferArtifactValue,
  PipelineArtifactDefinition,
} from "../src/artifact";
import type {
  PipelineEvent,
  PipelineGraph,
  PipelineGraphEdge,
  PipelineGraphNode,
  PipelineError,
} from "../src/events";
import type { PipelineRunResult, PipelineSummary } from "../src/results";
import type {
  InferRouteId,
  InferRouteOutput,
  InferRoutesOutput,
  PipelineRouteDefinition,
} from "../src/route";
import type {
  DefaultRange,
  FileContext,
  FilterContext,
  ParseContext,
  ParsedRow,
  ParserFn,
  PipelineFilter,
  PropertyJson,
  ResolvedEntry,
  ResolveContext,
  ResolverFn,
  RowContext,
} from "../src/types";

describe("FileContext type", () => {
  it("should have correct structure", () => {
    expectTypeOf<FileContext>().toMatchTypeOf<{
      version: string;
      dir: string;
      path: string;
      name: string;
      ext: string;
    }>();
  });

  it("should allow specific dir values", () => {
    const file: FileContext = {
      version: "16.0.0",
      dir: "ucd",
      path: "ucd/LineBreak.txt",
      name: "LineBreak.txt",
      ext: ".txt",
    };

    expectTypeOf(file.dir).toMatchTypeOf<string>();
  });
});

describe("RowContext type", () => {
  it("should have optional property field", () => {
    expectTypeOf<RowContext>().toMatchTypeOf<{ property?: string }>();
  });
});

describe("FilterContext type", () => {
  it("should have file and optional row", () => {
    expectTypeOf<FilterContext>().toMatchTypeOf<{
      file: FileContext;
      row?: RowContext;
    }>();
  });
});

describe("PipelineFilter type", () => {
  it("should be a predicate function", () => {
    expectTypeOf<PipelineFilter>().toEqualTypeOf<(ctx: FilterContext) => boolean>();
  });
});

describe("ParsedRow type", () => {
  it("should have required sourceFile and kind", () => {
    expectTypeOf<ParsedRow>().toMatchTypeOf<{
      sourceFile: string;
      kind: "range" | "point" | "sequence" | "alias";
    }>();
  });

  it("should have optional range fields", () => {
    expectTypeOf<ParsedRow>().toMatchTypeOf<{
      start?: string;
      end?: string;
      codePoint?: string;
      sequence?: string[];
    }>();
  });

  it("should have optional property and value", () => {
    expectTypeOf<ParsedRow>().toMatchTypeOf<{
      property?: string;
      value?: string | string[];
      meta?: Record<string, unknown>;
    }>();
  });
});

describe("ParseContext type", () => {
  it("should have file and reader methods", () => {
    expectTypeOf<ParseContext>().toMatchTypeOf<{
      file: FileContext;
      readContent: () => Promise<string>;
      readLines: () => AsyncIterable<string>;
      isComment: (line: string) => boolean;
    }>();
  });
});

describe("ParserFn type", () => {
  it("should take ParseContext and return AsyncIterable of ParsedRow", () => {
    expectTypeOf<ParserFn>().toEqualTypeOf<(ctx: ParseContext) => AsyncIterable<ParsedRow>>();
  });
});

describe("ResolvedEntry type", () => {
  it("should have value and optional location fields", () => {
    expectTypeOf<ResolvedEntry>().toMatchTypeOf<{
      value: string | string[];
      range?: `${string}..${string}`;
      codePoint?: string;
      sequence?: string[];
    }>();
  });
});

describe("DefaultRange type", () => {
  it("should have range and value", () => {
    expectTypeOf<DefaultRange>().toMatchTypeOf<{
      range: `${string}..${string}`;
      value: string | string[];
    }>();
  });
});

describe("PropertyJson type", () => {
  it("should have version, property, file, and entries", () => {
    expectTypeOf<PropertyJson>().toMatchTypeOf<{
      version: string;
      property: string;
      file: string;
      entries: ResolvedEntry[];
    }>();
  });

  it("should have optional defaults and meta", () => {
    expectTypeOf<PropertyJson>().toMatchTypeOf<{
      defaults?: DefaultRange[];
      meta?: Record<string, unknown>;
    }>();
  });
});

describe("ResolveContext type", () => {
  it("should have version and file", () => {
    expectTypeOf<ResolveContext>().toMatchTypeOf<{
      version: string;
      file: FileContext;
    }>();
  });

  it("should have getArtifact method", () => {
    type Ctx = ResolveContext<{ aliases: Map<string, string[]>; count: number }>;

    expectTypeOf<Ctx["getArtifact"]>().toBeFunction();
  });

  it("should have utility methods", () => {
    expectTypeOf<ResolveContext>().toMatchTypeOf<{
      normalizeEntries: (entries: ResolvedEntry[]) => ResolvedEntry[];
      now: () => string;
    }>();
  });
});

describe("ResolverFn type", () => {
  it("should take context and rows and return promise", () => {
    type Fn = ResolverFn<Record<string, unknown>, PropertyJson[]>;

    expectTypeOf<Fn>().toMatchTypeOf<
      (ctx: ResolveContext<Record<string, unknown>>, rows: AsyncIterable<ParsedRow>) => Promise<PropertyJson[]>
    >();
  });

  it("should support custom artifact types", () => {
    type CustomArtifacts = { cache: Map<string, number> };
    type Fn = ResolverFn<CustomArtifacts, string>;

    expectTypeOf<Fn>().toMatchTypeOf<
      (ctx: ResolveContext<CustomArtifacts>, rows: AsyncIterable<ParsedRow>) => Promise<string>
    >();
  });
});

describe("PipelineArtifactDefinition type", () => {
  it("should have id and build function", () => {
    expectTypeOf<PipelineArtifactDefinition>().toMatchTypeOf<{
      id: string;
      build: (ctx: { version: string }, rows?: AsyncIterable<ParsedRow>) => Promise<unknown>;
    }>();
  });

  it("should have optional filter and parser", () => {
    expectTypeOf<PipelineArtifactDefinition>().toMatchTypeOf<{
      filter?: PipelineFilter;
      parser?: ParserFn;
    }>();
  });

  it("should preserve generic id type", () => {
    type Specific = PipelineArtifactDefinition<"my-id", number>;
    expectTypeOf<Specific["id"]>().toEqualTypeOf<"my-id">();
  });

  it("should preserve generic value type", () => {
    type Specific = PipelineArtifactDefinition<"id", Map<string, boolean>>;
    expectTypeOf<Specific["build"]>().returns.resolves.toEqualTypeOf<Map<string, boolean>>();
  });
});

describe("InferArtifactId type", () => {
  it("should extract id from artifact definition", () => {
    type Def = PipelineArtifactDefinition<"extracted-id", unknown>;
    expectTypeOf<InferArtifactId<Def>>().toEqualTypeOf<"extracted-id">();
  });
});

describe("InferArtifactValue type", () => {
  it("should extract value type from artifact definition", () => {
    type Def = PipelineArtifactDefinition<"id", Set<number>>;
    expectTypeOf<InferArtifactValue<Def>>().toEqualTypeOf<Set<number>>();
  });
});

describe("InferArtifactsMap type", () => {
  it("should create a map from artifact array", () => {
    type Artifacts = [
      PipelineArtifactDefinition<"a", string>,
      PipelineArtifactDefinition<"b", number>,
      PipelineArtifactDefinition<"c", boolean>,
    ];

    expectTypeOf<InferArtifactsMap<Artifacts>>().toEqualTypeOf<{
      a: string;
      b: number;
      c: boolean;
    }>();
  });

  it("should handle complex value types", () => {
    type Artifacts = [
      PipelineArtifactDefinition<"map", Map<string, string[]>>,
      PipelineArtifactDefinition<"set", Set<number>>,
      PipelineArtifactDefinition<"obj", { nested: { value: boolean } }>,
    ];

    expectTypeOf<InferArtifactsMap<Artifacts>>().toEqualTypeOf<{
      map: Map<string, string[]>;
      set: Set<number>;
      obj: { nested: { value: boolean } };
    }>();
  });
});

describe("PipelineRouteDefinition type", () => {
  it("should have id, filter, parser, and resolver", () => {
    expectTypeOf<PipelineRouteDefinition>().toMatchTypeOf<{
      id: string;
      filter: PipelineFilter;
      parser: ParserFn;
    }>();
  });

  it("should preserve generic id type", () => {
    type Route = PipelineRouteDefinition<"my-route">;

    expectTypeOf<Route["id"]>().toEqualTypeOf<"my-route">();
  });
});

describe("InferRouteId type", () => {
  it("should extract id from route definition", () => {
    type Route = PipelineRouteDefinition<"line-break">;
    expectTypeOf<InferRouteId<Route>>().toEqualTypeOf<"line-break">();
  });
});

describe("InferRouteOutput type", () => {
  it("should extract output type from route definition", () => {
    type Route = PipelineRouteDefinition<"id", readonly [], Record<string, never>, readonly [], { custom: true }[]>;
    expectTypeOf<InferRouteOutput<Route>>().toEqualTypeOf<{ custom: true }[]>();
  });
});

describe("InferRoutesOutput type", () => {
  it("should union output types from route array", () => {
    type Routes = readonly [
      PipelineRouteDefinition<"a", readonly [], Record<string, never>, readonly [], PropertyJson[]>,
      PipelineRouteDefinition<"b", readonly [], Record<string, never>, readonly [], PropertyJson[]>,
    ];

    expectTypeOf<InferRoutesOutput<Routes>>().toEqualTypeOf<PropertyJson>();
  });
});

describe("PipelineEvent type", () => {
  it("should be a union of event types", () => {
    expectTypeOf<PipelineEvent>().toMatchTypeOf<{ type: string; timestamp: number }>();
  });

  it("should include pipeline lifecycle events", () => {
    const startEvent: PipelineEvent = {
      type: "pipeline:start",
      versions: ["16.0.0"],
      timestamp: Date.now(),
    };

    const endEvent: PipelineEvent = {
      type: "pipeline:end",
      durationMs: 100,
      timestamp: Date.now(),
    };

    expectTypeOf(startEvent).toMatchTypeOf<PipelineEvent>();
    expectTypeOf(endEvent).toMatchTypeOf<PipelineEvent>();
  });

  it("should include version events", () => {
    const startEvent: PipelineEvent = {
      type: "version:start",
      version: "16.0.0",
      timestamp: Date.now(),
    };

    expectTypeOf(startEvent).toMatchTypeOf<PipelineEvent>();
  });

  it("should include file events", () => {
    const matchedEvent: PipelineEvent = {
      type: "file:matched",
      file: { version: "16.0.0", dir: "", path: "test.txt", name: "test.txt", ext: ".txt" },
      routeId: "route-id",
      timestamp: Date.now(),
    };

    expectTypeOf(matchedEvent).toMatchTypeOf<PipelineEvent>();
  });

  it("should include error events", () => {
    const errorEvent: PipelineEvent = {
      type: "error",
      error: { scope: "route", message: "Failed", routeId: "id", version: "16.0.0" },
      timestamp: Date.now(),
    };

    expectTypeOf(errorEvent).toMatchTypeOf<PipelineEvent>();
  });
});

describe("PipelineGraphNode type", () => {
  it("should have id and type", () => {
    expectTypeOf<PipelineGraphNode>().toMatchTypeOf<{
      id: string;
      type: "source" | "artifact" | "file" | "route" | "output";
    }>();
  });
});

describe("PipelineGraphEdge type", () => {
  it("should have from, to, and type", () => {
    expectTypeOf<PipelineGraphEdge>().toMatchTypeOf<{
      from: string;
      to: string;
      type: "provides" | "matched" | "parsed" | "resolved" | "uses-artifact";
    }>();
  });
});

describe("PipelineGraph type", () => {
  it("should have nodes and edges", () => {
    expectTypeOf<PipelineGraph>().toMatchTypeOf<{
      nodes: PipelineGraphNode[];
      edges: PipelineGraphEdge[];
    }>();
  });
});

describe("PipelineError type", () => {
  it("should have scope and message", () => {
    expectTypeOf<PipelineError>().toMatchTypeOf<{
      scope: "artifact" | "route" | "file" | "pipeline" | "version";
      message: string;
    }>();
  });

  it("should have optional version", () => {
    expectTypeOf<PipelineError>().toMatchTypeOf<{ version?: string }>();
  });

  it("should have optional context fields", () => {
    expectTypeOf<PipelineError>().toMatchTypeOf<{
      error?: unknown;
      file?: FileContext;
      routeId?: string;
      artifactId?: string;
    }>();
  });
});

describe("PipelineSummary type", () => {
  it("should have file counts", () => {
    expectTypeOf<PipelineSummary>().toMatchTypeOf<{
      versions: string[];
      totalFiles: number;
      matchedFiles: number;
      skippedFiles: number;
      fallbackFiles: number;
      totalOutputs: number;
      durationMs: number;
    }>();
  });
});

describe("PipelineRunResult type", () => {
  it("should have data, graph, errors, and summary", () => {
    expectTypeOf<PipelineRunResult<PropertyJson>>().toMatchTypeOf<{
      data: PropertyJson[];
      graph: PipelineGraph;
      errors: PipelineError[];
      summary: PipelineSummary;
    }>();
  });

  it("should preserve generic data type", () => {
    type CustomOutput = { custom: true };
    expectTypeOf<PipelineRunResult<CustomOutput>["data"]>().toEqualTypeOf<CustomOutput[]>();
  });
});

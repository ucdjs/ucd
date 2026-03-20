import type { FallbackRouteDefinition } from "@ucdjs/pipelines-core";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  byName,
  definePipeline,
  definePipelineRoute,
  filesystemSink,

  pipelineOutputSource,
} from "@ucdjs/pipelines-core";
import { afterEach, describe, expect, it } from "vitest";
import { createMemoryCacheStore } from "../src/cache";
import { createPipelineExecutor } from "../src/executor";
import { createNodeExecutionRuntime } from "../src/runtime/node";
import { createMockFile, createTestSource, mockParser } from "./helpers";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.map(async (dir) => {
    await rm(dir, { recursive: true, force: true });
  }));
  tempDirs.length = 0;
});

describe("execution traces and output manifests", () => {
  it("records output traces and writes filesystem outputs", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "ucd-pipeline-traces-"));
    tempDirs.push(dir);

    const pipeline = definePipeline({
      id: "trace-pipeline",
      name: "Trace Pipeline",
      versions: ["16.0.0"],
      inputs: [createTestSource([createMockFile("Scripts.txt")], {
        "ucd/Scripts.txt": "0041;Latin",
      })],
      routes: [
        definePipelineRoute({
          id: "scripts",
          filter: byName("Scripts.txt"),
          parser: mockParser,
          resolver: async (ctx, rows) => {
            const entries = [];
            for await (const row of rows) {
              entries.push({ codePoint: row.codePoint!, value: row.value! });
            }

            return [{
              version: ctx.version,
              property: "Script",
              file: ctx.file.name,
              entries,
            }];
          },
          outputs: [{
            id: "json",
            sink: filesystemSink({ baseDir: dir }),
            path: ({ property, version }) => `${version}/${property?.toLowerCase()}.json`,
          }],
        }),
      ],
    });

    const traces: string[] = [];
    const executor = createPipelineExecutor({
      runtime: createNodeExecutionRuntime(),
      onTrace: (trace) => {
        traces.push(trace.kind);
      },
    });

    const [result] = await executor.run([pipeline]);
    expect(result).toBeDefined();
    expect(result?.outputManifest).toEqual([
      expect.objectContaining({
        outputId: "json",
        routeId: "scripts",
        status: "written",
      }),
    ]);
    expect(result?.traces.some((trace) => trace.kind === "output.resolved")).toBe(true);
    expect(result?.traces.some((trace) => trace.kind === "output.written")).toBe(true);
    expect(traces).toContain("file.matched");
    const outputFile = result?.outputManifest[0]?.locator;
    expect(outputFile).toBeDefined();
    expect(JSON.parse(await readFile(outputFile!, "utf8"))).toEqual(expect.objectContaining({
      property: "Script",
    }));
  });

  it("orders pipelines so outputs can be consumed downstream", async () => {
    const upstream = definePipeline({
      id: "upstream",
      name: "Upstream",
      versions: ["16.0.0"],
      inputs: [createTestSource([createMockFile("Scripts.txt")], {
        "ucd/Scripts.txt": "0041;Latin",
      })],
      routes: [
        definePipelineRoute({
          id: "scripts",
          filter: byName("Scripts.txt"),
          parser: mockParser,
          resolver: async (ctx, rows) => {
            const entries = [];
            for await (const row of rows) {
              entries.push({ codePoint: row.codePoint!, value: row.value! });
            }

            return [{
              version: ctx.version,
              property: "Script",
              file: ctx.file.name,
              entries,
            }];
          },
          outputs: [{
            id: "published-json",
            path: ({ property }) => `published/${property}.json`,
          }],
        }),
      ],
    });

    const downstream = definePipeline({
      id: "downstream",
      name: "Downstream",
      versions: ["16.0.0"],
      inputs: [pipelineOutputSource({ pipelineId: "upstream", outputId: "published-json" })],
      routes: [
        definePipelineRoute({
          id: "consume",
          filter: () => true,
          async* parser(ctx) {
            const content = await ctx.readContent();
            const parsed = JSON.parse(content) as { property: string };
            yield {
              sourceFile: ctx.file.path,
              kind: "alias",
              value: parsed.property,
            };
          },
          resolver: async (ctx, rows) => {
            const values: string[] = [];
            for await (const row of rows) {
              values.push(String(row.value ?? ""));
            }

            return [{
              version: ctx.version,
              property: "Consumed",
              file: ctx.file.name,
              entries: values.map((value, index) => ({ codePoint: `${index}`, value })),
            }];
          },
        }),
      ],
    });

    const executor = createPipelineExecutor({});
    const results = await executor.run([downstream, upstream]);

    expect(results.map((result) => result.id)).toEqual(["upstream", "downstream"]);
    expect(results[1]?.data[0]).toEqual(expect.objectContaining({
      property: "Consumed",
      entries: [{ codePoint: "0", value: "Script" }],
    }));
  });

  it("records fallback outputs in the trace-derived manifest", async () => {
    const fallback: FallbackRouteDefinition = {
      parser: mockParser,
      resolver: async (ctx, rows) => {
        const entries = [];
        for await (const row of rows) {
          entries.push({ codePoint: row.codePoint!, value: String(row.value ?? "") });
        }

        return [{
          version: ctx.version,
          property: "Fallback",
          file: ctx.file.name,
          entries,
        }];
      },
    };

    const pipeline = definePipeline({
      id: "fallback-pipeline",
      name: "Fallback Pipeline",
      versions: ["16.0.0"],
      inputs: [createTestSource([createMockFile("Unknown.txt")], {
        "ucd/Unknown.txt": "0041;Fallback",
      })],
      routes: [],
      fallback,
    });

    const [result] = await createPipelineExecutor({}).run([pipeline]);

    expect(result?.outputManifest).toEqual([
      expect.objectContaining({
        routeId: "__fallback__",
        outputId: "fallback-output",
        status: "written",
        locator: "memory://Fallback.json",
      }),
    ]);
  });

  it("marks output writes as failed when sink persistence errors", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "ucd-pipeline-failed-output-"));
    tempDirs.push(dir);
    const blockedBaseDir = path.join(dir, "blocked");
    await writeFile(blockedBaseDir, "not a directory", "utf8");

    const pipeline = definePipeline({
      id: "failed-output",
      name: "Failed Output",
      versions: ["16.0.0"],
      inputs: [createTestSource([createMockFile("Scripts.txt")], {
        "ucd/Scripts.txt": "0041;Latin",
      })],
      routes: [
        definePipelineRoute({
          id: "scripts",
          filter: byName("Scripts.txt"),
          parser: mockParser,
          resolver: async () => [{
            version: "16.0.0",
            property: "Script",
            entries: [],
          }],
          outputs: [{
            id: "json",
            sink: filesystemSink({ baseDir: blockedBaseDir }),
            path: "nested/script.json",
          }],
        }),
      ],
    });

    const [result] = await createPipelineExecutor({ runtime: createNodeExecutionRuntime() }).run([pipeline]);

    expect(result?.status).toBe("failed");
    expect(result?.outputManifest).toEqual([
      expect.objectContaining({
        outputId: "json",
        status: "failed",
      }),
    ]);
    expect(result?.traces).toEqual(expect.arrayContaining([
      expect.objectContaining({
        kind: "output.written",
        status: "failed",
      }),
    ]));
  });

  it("records cache miss/store on first run and cache hit on second run", async () => {
    const cacheStore = createMemoryCacheStore();
    const pipeline = definePipeline({
      id: "cached-pipeline",
      name: "Cached Pipeline",
      versions: ["16.0.0"],
      inputs: [createTestSource([createMockFile("Scripts.txt")], {
        "ucd/Scripts.txt": "0041;Latin",
      })],
      routes: [
        definePipelineRoute({
          id: "scripts",
          filter: byName("Scripts.txt"),
          parser: mockParser,
          resolver: async () => [{
            version: "16.0.0",
            property: "Script",
            entries: [],
          }],
        }),
      ],
    });

    const executor = createPipelineExecutor({ cacheStore });
    const [first] = await executor.run([pipeline], { cache: true });
    const [second] = await executor.run([pipeline], { cache: true });

    expect(first?.traces.map((trace) => trace.kind)).toEqual(expect.arrayContaining([
      "cache.miss",
      "cache.store",
    ]));
    expect(second?.traces.map((trace) => trace.kind)).toContain("cache.hit");
  });
});

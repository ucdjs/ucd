import { mkdtemp, readFile, rm } from "node:fs/promises";
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
import { createPipelineExecutor } from "../src/executor";
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
          async *parser(ctx) {
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
});

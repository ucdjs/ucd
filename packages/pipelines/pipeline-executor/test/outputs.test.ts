import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { byName, definePipelineRoute, filesystemSink, normalizeRouteOutputs } from "@ucdjs/pipelines-core";
import { afterEach, describe, expect, it } from "vitest";
import {
  materializeOutputs,
  renderOutputPathTemplate,
  resolveOutputDestination,
  serializeOutputValue,
  writeOutputToSink,
} from "../src/internal/outputs";
import { buildOutputManifestFromTraces } from "../src/internal/traces";
import { createMockFile } from "./helpers";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.map(async (dir) => {
    await rm(dir, { recursive: true, force: true });
  }));
  tempDirs.length = 0;
});

describe("output utilities", () => {
  it("renders template paths and resolves runtime-only outputs to memory locators", () => {
    const route = definePipelineRoute({
      id: "scripts",
      filter: byName("Scripts.txt"),
      async* parser() {},
      resolver: async () => [],
      outputs: [{
        id: "preview",
        path: "preview/{version}/{property:kebab}.json",
      }],
    });

    const [output] = normalizeRouteOutputs(route);
    const file = createMockFile("Scripts.txt");
    const rendered = renderOutputPathTemplate(output!.path as string, {
      version: "16.0.0",
      routeId: "scripts",
      file,
      output: { property: "Script_Extensions" },
      property: "Script_Extensions",
      outputIndex: 0,
    });

    expect(rendered).toBe("preview/16.0.0/script-extensions.json");
    expect(resolveOutputDestination(output!, {
      version: "16.0.0",
      routeId: "scripts",
      file,
      output: { property: "Script_Extensions" },
      property: "Script_Extensions",
      outputIndex: 0,
    })).toEqual({
      locator: "memory://preview/16.0.0/script-extensions.json",
      displayLocator: "memory://preview/16.0.0/script-extensions.json",
    });
  });

  it("writes filesystem outputs using the configured format", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "ucd-executor-output-"));
    tempDirs.push(dir);

    const jsonFile = path.join(dir, "payload.json");
    const textFile = path.join(dir, "payload.txt");

    await writeOutputToSink(filesystemSink({ baseDir: dir }), jsonFile, { hello: "world" }, "json");
    await writeOutputToSink(filesystemSink({ baseDir: dir }), textFile, "plain text", "text");

    expect(JSON.parse(await readFile(jsonFile, "utf8"))).toEqual({ hello: "world" });
    expect(await readFile(textFile, "utf8")).toBe("plain text");
    expect(serializeOutputValue({ value: "x" }, "text")).toContain("\"value\"");
  });

  it("materializes output values into trace facts that build a manifest", async () => {
    const route = definePipelineRoute({
      id: "scripts",
      filter: byName("Scripts.txt"),
      async* parser() {},
      resolver: async () => [],
      outputs: [{
        id: "preview",
        path: "preview/{version}/{property:kebab}.json",
      }],
    });

    const [definition] = normalizeRouteOutputs(route);
    const file = createMockFile("Scripts.txt");
    const outputs: unknown[] = [];
    const traces = [] as Array<ReturnType<typeof buildTraceRecord>>;

    await materializeOutputs({
      outputs,
      version: "16.0.0",
      routeId: "scripts",
      file,
      values: [{
        version: "16.0.0",
        property: "Script_Extensions",
        entries: [],
      }],
      definitions: [definition!],
      emitTrace: async (trace) => {
        const record = buildTraceRecord(trace);
        traces.push(record);
        return record;
      },
    });

    expect(outputs).toHaveLength(1);
    expect(traces.map((trace) => trace.kind)).toEqual([
      "output.produced",
      "output.resolved",
      "output.written",
    ]);
    expect(buildOutputManifestFromTraces(traces)).toEqual([
      expect.objectContaining({
        outputId: "preview",
        routeId: "scripts",
        status: "written",
        locator: "memory://preview/16.0.0/script-extensions.json",
      }),
    ]);
  });
});

function buildTraceRecord<TTrace extends Parameters<typeof materializeOutputs>[0]["emitTrace"] extends (trace: infer TInput) => Promise<unknown> ? TInput : never>(trace: TTrace) {
  return {
    id: `trace-${Date.now()}-${Math.random()}`,
    pipelineId: "test-pipeline",
    timestamp: Date.now(),
    ...trace,
  };
}

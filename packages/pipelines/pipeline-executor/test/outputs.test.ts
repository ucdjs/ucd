import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  byName,
  definePipelineRoute,
  filesystemSink,
  normalizeRouteOutputs,
} from "@ucdjs/pipeline-core";
import { afterEach, describe, expect, it } from "vitest";
import {
  materializeOutputs,
  renderOutputPathTemplate,
  resolveOutputDestination,
  serializeOutputValue,
  writeOutputToSink,
} from "../src/run/outputs";
import { createNoopExecutionRuntime } from "../src/runtime";
import { createNodeExecutionRuntime } from "../src/runtime/node";
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

    const runtime = createNodeExecutionRuntime();
    await writeOutputToSink(filesystemSink({ baseDir: dir }), jsonFile, { hello: "world" }, "json", runtime);
    await writeOutputToSink(filesystemSink({ baseDir: dir }), textFile, "plain text", "text", runtime);

    expect(JSON.parse(await readFile(jsonFile, "utf8"))).toEqual({ hello: "world" });
    expect(await readFile(textFile, "utf8")).toBe("plain text");
    expect(serializeOutputValue({ value: "x" }, "text")).toContain("\"value\"");
  });

  it("materializes output values and returns a manifest directly", async () => {
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
    const runtime = createNoopExecutionRuntime();

    const manifest = await materializeOutputs({
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
      runtime,
      pipelineId: "test-pipeline",
    });

    expect(outputs).toHaveLength(1);
    expect(manifest.entries).toEqual([
      expect.objectContaining({
        outputId: "preview",
        routeId: "scripts",
        pipelineId: "test-pipeline",
        status: "written",
        locator: "memory://preview/16.0.0/script-extensions.json",
      }),
    ]);
    expect(manifest.writeErrors).toHaveLength(0);
  });
});

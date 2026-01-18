import { z } from "zod";
import {
  artifact,
  byName,
  createMemoryCacheStore,
  definePipeline,
  definePipelineRoute,
  definePipelineSource,
  type FileContext,
  type PipelineEvent,
  type PropertyJson,
  type ResolvedEntry,
} from "../src";

const MOCK_FILES: Record<string, Record<string, string>> = {
  "16.0.0": {
    "ucd/UnicodeData.txt": `0041;LATIN CAPITAL LETTER A;Lu;0;L;;;;;N;;;;0061;
0042;LATIN CAPITAL LETTER B;Lu;0;L;;;;;N;;;;0062;
0043;LATIN CAPITAL LETTER C;Lu;0;L;;;;;N;;;;0063;
0061;LATIN SMALL LETTER A;Ll;0;L;;;;;N;;;0041;;0041
0062;LATIN SMALL LETTER B;Ll;0;L;;;;;N;;;0042;;0042
0063;LATIN SMALL LETTER C;Ll;0;L;;;;;N;;;0043;;0043`,
    "ucd/LineBreak.txt": `# LineBreak.txt
0041..005A;AL
0061..007A;AL
0030..0039;NU`,
    "ucd/Scripts.txt": `# Scripts.txt
0041..005A;Latin
0061..007A;Latin
0030..0039;Common`,
  },
  "15.1.0": {
    "ucd/UnicodeData.txt": `0041;LATIN CAPITAL LETTER A;Lu;0;L;;;;;N;;;;0061;
0042;LATIN CAPITAL LETTER B;Lu;0;L;;;;;N;;;;0062;
0061;LATIN SMALL LETTER A;Ll;0;L;;;;;N;;;0041;;0041
0062;LATIN SMALL LETTER B;Ll;0;L;;;;;N;;;0042;;0042`,
    "ucd/LineBreak.txt": `# LineBreak.txt
0041..005A;AL
0061..007A;AL`,
    "ucd/Scripts.txt": `# Scripts.txt
0041..005A;Latin
0061..007A;Latin`,
  },
};

const mockSource = definePipelineSource({
  id: "mock",
  backend: {
    async listFiles(version: string): Promise<FileContext[]> {
      const versionFiles = MOCK_FILES[version];
      if (!versionFiles) {
        return [];
      }

      return Object.keys(versionFiles).map((path) => {
        const parts = path.split("/");
        const name = parts[parts.length - 1] ?? "";
        const dir = parts[0] ?? "";
        const ext = name.includes(".") ? `.${name.split(".").pop()}` : "";

        return { version, path, name, dir, ext };
      });
    },

    async readFile(file: FileContext): Promise<string> {
      const versionFiles = MOCK_FILES[file.version];
      if (!versionFiles) {
        throw new Error(`Version not found: ${file.version}`);
      }

      const content = versionFiles[file.path];
      if (content === undefined) {
        throw new Error(`File not found: ${file.path}`);
      }

      return content;
    },
  },
});

const unicodeDataRoute = definePipelineRoute({
  id: "unicode-data-names",
  filter: byName("UnicodeData.txt"),
  emits: {
    names: artifact(z.map(z.string(), z.string())),
  },
  parser: async function* (ctx) {
    for await (const line of ctx.readLines()) {
      if (ctx.isComment(line)) continue;
      const parts = line.split(";");
      if (parts.length < 2) continue;

      const codePoint = parts[0];
      const name = parts[1];

      yield {
        sourceFile: ctx.file.path,
        kind: "point" as const,
        codePoint,
        value: name,
      };
    }
  },
  resolver: async (ctx, rows) => {
    const names = new Map<string, string>();

    for await (const row of rows) {
      if (row.codePoint && row.value) {
        names.set(row.codePoint, String(row.value));
      }
    }

    ctx.emitArtifact("names", names);

    return [];
  },
});

const lineBreakRoute = definePipelineRoute({
  id: "line-break",
  filter: byName("LineBreak.txt"),
  depends: ["artifact:unicode-data-names:names"] as const,
  parser: async function* (ctx) {
    for await (const line of ctx.readLines()) {
      if (ctx.isComment(line)) continue;
      const [range, value] = line.split(";").map((s) => s.trim());
      if (!range || !value) continue;

      if (range.includes("..")) {
        const [start, end] = range.split("..");
        yield {
          sourceFile: ctx.file.path,
          kind: "range" as const,
          start,
          end,
          value,
        };
      } else {
        yield {
          sourceFile: ctx.file.path,
          kind: "point" as const,
          codePoint: range,
          value,
        };
      }
    }
  },
  resolver: async (ctx, rows) => {
    const names = ctx.getArtifact("unicode-data-names:names") as Map<string, string>;
    const entries: ResolvedEntry[] = [];
    const meta: Record<string, unknown> = {
      enrichedWithNames: true,
      namesCount: names.size,
    };

    for await (const row of rows) {
      if (row.kind === "range" && row.start && row.end) {
        const startInt = parseInt(row.start, 16);
        const endInt = parseInt(row.end, 16);
        const sampleNames: string[] = [];
        for (let cp = startInt; cp <= Math.min(endInt, startInt + 2); cp++) {
          const hex = cp.toString(16).toUpperCase().padStart(4, "0");
          const name = names.get(hex);
          if (name) sampleNames.push(name);
        }
        entries.push({
          range: `${row.start}..${row.end}`,
          value: [String(row.value), ...sampleNames],
        });
      } else if (row.codePoint) {
        const name = names.get(row.codePoint);
        entries.push({
          codePoint: row.codePoint,
          value: name ? [String(row.value), name] : String(row.value),
        });
      }
    }

    return [
      {
        version: ctx.version,
        property: "Line_Break",
        file: ctx.file.name,
        entries: ctx.normalizeEntries(entries),
        meta,
      },
    ];
  },
});

const scriptsRoute = definePipelineRoute({
  id: "scripts",
  filter: byName("Scripts.txt"),
  depends: ["artifact:unicode-data-names:names"] as const,
  parser: async function* (ctx) {
    for await (const line of ctx.readLines()) {
      if (ctx.isComment(line)) continue;
      const [range, value] = line.split(";").map((s) => s.trim());
      if (!range || !value) continue;

      if (range.includes("..")) {
        const [start, end] = range.split("..");
        yield {
          sourceFile: ctx.file.path,
          kind: "range" as const,
          start,
          end,
          value,
        };
      } else {
        yield {
          sourceFile: ctx.file.path,
          kind: "point" as const,
          codePoint: range,
          value,
        };
      }
    }
  },
  resolver: async (ctx, rows) => {
    const names = ctx.getArtifact("unicode-data-names:names") as Map<string, string>;
    const entries: ResolvedEntry[] = [];
    const meta: Record<string, unknown> = {
      enrichedWithNames: true,
      namesCount: names.size,
    };

    for await (const row of rows) {
      if (row.kind === "range" && row.start && row.end) {
        const startInt = parseInt(row.start, 16);
        const endInt = parseInt(row.end, 16);
        const sampleNames: string[] = [];
        for (let cp = startInt; cp <= Math.min(endInt, startInt + 2); cp++) {
          const hex = cp.toString(16).toUpperCase().padStart(4, "0");
          const name = names.get(hex);
          if (name) sampleNames.push(name);
        }
        entries.push({
          range: `${row.start}..${row.end}`,
          value: [String(row.value), ...sampleNames],
        });
      } else if (row.codePoint) {
        const name = names.get(row.codePoint);
        entries.push({
          codePoint: row.codePoint,
          value: name ? [String(row.value), name] : String(row.value),
        });
      }
    }

    return [
      {
        version: ctx.version,
        property: "Script",
        file: ctx.file.name,
        entries: ctx.normalizeEntries(entries),
        meta,
      },
    ];
  },
});

async function main() {
  const cacheStore = createMemoryCacheStore();

  const events: PipelineEvent[] = [];

  const pipeline = definePipeline({
    versions: ["16.0.0", "15.1.0"],
    inputs: [mockSource],
    cacheStore,
    routes: [unicodeDataRoute, lineBreakRoute, scriptsRoute],
    onEvent: (event) => {
      events.push(event);
      if (event.type === "artifact:produced") {
        console.log(`  [ARTIFACT] ${event.artifactId} produced by ${event.routeId}`);
      } else if (event.type === "artifact:consumed") {
        console.log(`  [ARTIFACT] ${event.artifactId} consumed by ${event.routeId}`);
      } else if (event.type === "cache:hit") {
        console.log(`  [CACHE HIT] ${event.routeId} for ${event.file.name}`);
      } else if (event.type === "cache:miss") {
        console.log(`  [CACHE MISS] ${event.routeId} for ${event.file.name}`);
      } else if (event.type === "cache:store") {
        console.log(`  [CACHE STORE] ${event.routeId} for ${event.file.name}`);
      }
    },
  });

  console.log("=== First Run (cache miss expected) ===\n");

  const result1 = await pipeline.run();

  console.log("\n--- Summary ---");
  console.log(`Versions: ${result1.summary.versions.join(", ")}`);
  console.log(`Total files: ${result1.summary.totalFiles}`);
  console.log(`Matched files: ${result1.summary.matchedFiles}`);
  console.log(`Outputs: ${result1.summary.totalOutputs}`);
  console.log(`Duration: ${result1.summary.durationMs.toFixed(2)}ms`);
  console.log(`Errors: ${result1.errors.length}`);

  if (result1.errors.length > 0) {
    console.log("\nErrors:");
    for (const error of result1.errors) {
      console.log(`  - ${error.message}`);
    }
  }

  console.log("\n--- Outputs ---");
  for (const output of result1.data) {
    const pj = output as PropertyJson;
    console.log(`  ${pj.version} / ${pj.property}: ${pj.entries.length} entries`);
  }

  const stats1 = await cacheStore.stats?.();
  console.log(`\n--- Cache Stats ---`);
  console.log(`Entries: ${stats1?.entries}`);
  console.log(`Hits: ${stats1?.hits}`);
  console.log(`Misses: ${stats1?.misses}`);

  console.log("\n\n=== Second Run (cache hit expected) ===\n");

  events.length = 0;

  const result2 = await pipeline.run();

  console.log("\n--- Summary ---");
  console.log(`Duration: ${result2.summary.durationMs.toFixed(2)}ms`);
  console.log(`Outputs: ${result2.summary.totalOutputs}`);

  const stats2 = await cacheStore.stats?.();
  console.log(`\n--- Cache Stats ---`);
  console.log(`Entries: ${stats2?.entries}`);
  console.log(`Hits: ${stats2?.hits}`);
  console.log(`Misses: ${stats2?.misses}`);

  console.log("\n\n=== Third Run (cache disabled) ===\n");

  events.length = 0;

  const result3 = await pipeline.run({ cache: false });

  console.log("\n--- Summary ---");
  console.log(`Duration: ${result3.summary.durationMs.toFixed(2)}ms`);

  const stats3 = await cacheStore.stats?.();
  console.log(`\n--- Cache Stats (unchanged) ---`);
  console.log(`Entries: ${stats3?.entries}`);
  console.log(`Hits: ${stats3?.hits}`);
  console.log(`Misses: ${stats3?.misses}`);

  console.log("\n\n=== Verification ===");
  const outputsMatch = JSON.stringify(result1.data) === JSON.stringify(result2.data);
  console.log(`Outputs from run 1 and run 2 match: ${outputsMatch}`);

  const cacheHitEvents = events.filter((e) => e.type === "cache:hit").length;
  const cacheMissEvents = events.filter((e) => e.type === "cache:miss").length;
  console.log(`Run 2: ${cacheHitEvents} cache hits, ${cacheMissEvents} cache misses`);
}

main().catch(console.error);

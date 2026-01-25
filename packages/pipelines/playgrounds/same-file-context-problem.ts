import { z } from "zod";
import {
  artifact,
  byName,
  definePipeline,
  definePipelineRoute,
  definePipelineSource,
  type FileContext,
  type ResolvedEntry,
} from "../src";

const UNICODE_DATA = `0041;LATIN CAPITAL LETTER A;Lu;0;L;;;;;N;;;;0061;
0042;LATIN CAPITAL LETTER B;Lu;0;L;;;;;N;;;;0062;
0043;LATIN CAPITAL LETTER C;Lu;0;L;;;;;N;;;;0063;`;

const sameFileSource = definePipelineSource({
  id: "same-file",
  backend: {
    async listFiles(version: string): Promise<FileContext[]> {
      return [
        {
          version,
          path: "ucd/UnicodeData.txt",
          name: "UnicodeData.txt",
          dir: "ucd",
          ext: ".txt",
        },
      ];
    },

    async readFile(_file: FileContext): Promise<string> {
      return UNICODE_DATA;
    },
  },
});

console.log("=== Problem: Adding context to the SAME file ===\n");
console.log("Scenario: We want to:");
console.log("  1. First pass: Extract basic data");
console.log("  2. Second pass: Enrich the same data with additional context");
console.log("  Both passes need to process UnicodeData.txt\n");

const firstPassRoute = definePipelineRoute({
  id: "first-pass-basic",
  filter: byName("UnicodeData.txt"),
  emits: {
    "basic-data": artifact(z.array(z.object({ codePoint: z.string(), name: z.string() }))),
  },
  parser: async function* (ctx) {
    console.log("📄 FIRST PASS: Extracting basic character data");
    for await (const line of ctx.readLines()) {
      if (ctx.isComment(line)) continue;
      const parts = line.split(";");
      yield {
        sourceFile: ctx.file.path,
        kind: "point" as const,
        codePoint: parts[0],
        value: parts[1],
      };
    }
  },

  resolver: async (ctx, rows) => {
    const basicData: Array<{ codePoint: string; name: string }> = [];

    for await (const row of rows) {
      if (row.codePoint && row.value) {
        basicData.push({
          codePoint: row.codePoint,
          name: String(row.value),
        });
      }
    }

    console.log(`✅ First pass extracted ${basicData.length} basic entries`);
    console.log("   Emitting artifact: 'basic-data'\n");

    ctx.emitArtifact("basic-data", basicData);

    return [];
  },
});

const secondPassRoute = definePipelineRoute({
  id: "second-pass-enriched",
  filter: byName("UnicodeData.txt"),
  depends: ["artifact:first-pass-basic:basic-data"] as const,
  parser: async function* (ctx) {
    console.log("📄 SECOND PASS: Would extract category data");
    for await (const line of ctx.readLines()) {
      if (ctx.isComment(line)) continue;
      const parts = line.split(";");
      yield {
        sourceFile: ctx.file.path,
        kind: "point" as const,
        codePoint: parts[0],
        value: parts[2],
      };
    }
  },

  resolver: async (ctx, rows) => {
    console.log("🔍 Attempting to get 'basic-data' artifact...");

    const basicData = ctx.getArtifact("first-pass-basic:basic-data") as Array<{
      codePoint: string;
      name: string;
    }>;

    console.log(`✅ Got basic data with ${basicData.length} entries`);

    const entries: ResolvedEntry[] = [];

    for await (const row of rows) {
      if (row.codePoint && row.value) {
        const basic = basicData.find((b) => b.codePoint === row.codePoint);

        entries.push({
          codePoint: row.codePoint,
          value: basic
            ? `${basic.name} (${row.value})`
            : String(row.value),
        });
      }
    }

    return [
      {
        version: ctx.version,
        property: "Enriched_Data",
        file: ctx.file.name,
        entries,
      },
    ];
  },
});

async function main() {
  console.log("Routes defined:");
  console.log("  1. first-pass-basic (UnicodeData.txt) - emits 'basic-data'");
  console.log("  2. second-pass-enriched (UnicodeData.txt) - depends on 'first-pass-basic:basic-data'");
  console.log("\nWith DAG-based execution, both routes can process the same file!\n");

  const pipeline = definePipeline({
    versions: ["16.0.0"],
    inputs: [sameFileSource],
    routes: [
      firstPassRoute,
      secondPassRoute,
    ],
  });

  try {
    const result = await pipeline.run();

    console.log("\n=== Results ===");
    console.log(`Outputs: ${result.summary.totalOutputs}`);
    console.log(`Errors: ${result.errors.length}`);

    if (result.errors.length > 0) {
      console.log("\n❌ Errors:");
      for (const error of result.errors) {
        console.log(`   ${error.message}`);
      }
    }

    if (result.data.length > 0) {
      console.log("\n=== Output Data ===");
      console.log(JSON.stringify(result.data, null, 2));
    }
  } catch (error) {
    console.log("\n❌ Pipeline failed:");
    console.log(`   ${error}`);
  }

  console.log("\n=== Solution ===");
  console.log("With the new DAG-based execution:");
  console.log("  1. Routes declare dependencies via 'depends' array");
  console.log("  2. Routes declare what they emit via 'emits' object with Zod schemas");
  console.log("  3. Multiple routes CAN match the same file");
  console.log("  4. Execution order is determined by dependency graph, not array order");
  console.log("  5. Artifacts use prefixed keys: 'route-id:artifact-name'");
}

main().catch(console.error);

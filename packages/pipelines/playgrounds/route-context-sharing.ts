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
0043;LATIN CAPITAL LETTER C;Lu;0;L;;;;;N;;;;0063;
0061;LATIN SMALL LETTER A;Ll;0;L;;;;;N;;;0041;;0041
0062;LATIN SMALL LETTER B;Ll;0;L;;;;;N;;;0042;;0042
0063;LATIN SMALL LETTER C;Ll;0;L;;;;;N;;;0043;;0043`;

const LINE_BREAK_DATA = `# LineBreak.txt
0041..005A;AL
0061..007A;AL`;

const FILES: Record<string, string> = {
  "ucd/UnicodeData.txt": UNICODE_DATA,
  "ucd/LineBreak.txt": LINE_BREAK_DATA,
};

const contextSharingSource = definePipelineSource({
  id: "context-sharing",
  backend: {
    async listFiles(version: string): Promise<FileContext[]> {
      return Object.keys(FILES).map((path) => {
        const parts = path.split("/");
        const name = parts[parts.length - 1]!;
        const dir = parts[0] || "ucd";
        return {
          version,
          path,
          name,
          dir,
          ext: "." + name.split(".").pop()!,
        };
      });
    },

    async readFile(file: FileContext): Promise<string> {
      return FILES[file.path] || "";
    },
  },
});

console.log("=== Pattern: Route-to-Route Data Context Sharing ===\n");

const namesRoute = definePipelineRoute({
  id: "extract-names",
  filter: byName("UnicodeData.txt"),
  emits: {
    names: artifact(z.map(z.string(), z.string())),
  },
  parser: async function* (ctx) {
    console.log("📄 Processing UnicodeData.txt (names route)");
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
    const names = new Map<string, string>();

    for await (const row of rows) {
      if (row.codePoint && row.value) {
        names.set(row.codePoint, String(row.value));
      }
    }

    console.log(`✅ Extracted ${names.size} character names`);
    console.log(`   Emitting artifact: "names"\n`);

    ctx.emitArtifact("names", names);

    return [];
  },
});

const lineBreakRoute = definePipelineRoute({
  id: "line-break-enriched",
  filter: byName("LineBreak.txt"),
  depends: ["artifact:extract-names:names"] as const,
  parser: async function* (ctx) {
    console.log("📄 Processing LineBreak.txt");
    for await (const line of ctx.readLines()) {
      if (ctx.isComment(line)) continue;
      const [range, value] = line.split(";").map((s) => s.trim());
      if (!range || !value) continue;

      const [start, end] = range.includes("..")
        ? range.split("..")
        : [range, range];

      yield {
        sourceFile: ctx.file.path,
        kind: "range" as const,
        start,
        end,
        value,
      };
    }
  },
  resolver: async (ctx, rows) => {
    console.log("🔍 Attempting to get 'names' artifact...");

    const names = ctx.getArtifact("extract-names:names") as Map<string, string>;

    console.log(`✅ Got names artifact with ${names.size} entries`);
    console.log("   Now enriching LineBreak data with character names\n");

    const entries: ResolvedEntry[] = [];

    for await (const row of rows) {
      if (row.start && row.end) {
        const startInt = parseInt(row.start, 16);
        const endInt = parseInt(row.end, 16);

        const sampleNames: string[] = [];
        for (let cp = startInt; cp <= Math.min(endInt, startInt + 2); cp++) {
          const hex = cp.toString(16).toUpperCase().padStart(4, "0");
          const name = names.get(hex);
          if (name) {
            sampleNames.push(name);
          }
        }

        entries.push({
          range: `${row.start}..${row.end}` as const,
          value: [String(row.value), `Examples: ${sampleNames.join(", ")}`],
        });
      }
    }

    return [
      {
        version: ctx.version,
        property: "Line_Break",
        file: ctx.file.name,
        entries,
        meta: {
          enrichedWithNames: true,
          namesCount: names.size,
        },
      },
    ];
  },
});

async function main() {
  console.log("Route execution order:");
  console.log("  1. extract-names (UnicodeData.txt) → emits 'names' artifact");
  console.log("  2. line-break-enriched (LineBreak.txt) → consumes 'extract-names:names' artifact\n");

  const pipeline = definePipeline({
    versions: ["16.0.0"],
    inputs: [contextSharingSource],
    routes: [
      namesRoute,
      lineBreakRoute,
    ],
  });

  const result = await pipeline.run();

  console.log("=== Results ===");
  console.log(`Outputs: ${result.summary.totalOutputs}`);
  console.log("\n=== Enriched Data ===");
  console.log(JSON.stringify(result.data, null, 2));

  console.log("\n=== Key Insight ===");
  console.log("✅ With the new DAG-based execution, route order is determined by dependencies.");
  console.log("   Routes declare 'depends: [\"artifact:extract-names:names\"]' to ensure correct ordering.");
}

main().catch(console.error);

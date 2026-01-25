import {
  byName,
  definePipeline,
  definePipelineRoute,
  definePipelineSource,
  type FileContext,
} from "../src";

// Minimal in-memory source with just one file
const MOCK_DATA = `# LineBreak.txt - Simple test data
0041..005A;AL  # Latin uppercase
0061..007A;AL  # Latin lowercase
0030..0039;NU  # ASCII digits`;

const minimalSource = definePipelineSource({
  id: "minimal",
  backend: {
    async listFiles(version: string): Promise<FileContext[]> {
      return [
        {
          version,
          path: "ucd/LineBreak.txt",
          name: "LineBreak.txt",
          dir: "ucd",
          ext: ".txt",
        },
      ];
    },

    async readFile(_file: FileContext): Promise<string> {
      return MOCK_DATA;
    },
  },
});

const lineBreakRoute = definePipelineRoute({
  id: "line-break",
  filter: byName("LineBreak.txt"),
  parser: async function* (ctx) {
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
    const entries = [];
    for await (const row of rows) {
      if (row.start && row.end) {
        entries.push({
          range: `${row.start}..${row.end}` as const,
          value: String(row.value),
        });
      }
    }

    return [
      {
        version: ctx.version,
        property: "Line_Break",
        file: ctx.file.name,
        entries,
      },
    ];
  },
});

async function main() {
  const pipeline = definePipeline({
    versions: ["16.0.0"],
    inputs: [minimalSource],
    routes: [lineBreakRoute],
    onEvent: (event) => {
      console.log(`[${event.type}]`, event);
    },
  });

  const result = await pipeline.run();

  console.log("\n=== Results ===");
  console.log(`Files processed: ${result.summary.matchedFiles}`);
  console.log(`Outputs: ${result.summary.totalOutputs}`);
  console.log(`Duration: ${result.summary.durationMs.toFixed(2)}ms`);

  console.log("\n=== Data ===");
  console.log(JSON.stringify(result.data, null, 2));
}

main().catch(console.error);

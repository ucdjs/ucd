import {
  byName,
  definePipeline,
  definePipelineRoute,
  definePipelineSource,
  type FileContext,
} from "../src";

const MOCK_DATA = `0041;LATIN CAPITAL LETTER A;Lu;0;L;;;;;N;;;;0061;
0042;LATIN CAPITAL LETTER B;Lu;0;L;;;;;N;;;;0062;
0043;LATIN CAPITAL LETTER C;Lu;0;L;;;;;N;;;;0063;`;

const multipleRoutesSource = definePipelineSource({
  id: "multiple-routes",
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
      return MOCK_DATA;
    },
  },
});

const firstRoute = definePipelineRoute({
  id: "extract-names",
  filter: byName("UnicodeData.txt"),

  parser: async function* (ctx) {
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
    const names = [];
    for await (const row of rows) {
      names.push(`${row.codePoint}: ${row.value}`);
    }

    console.log("\n✅ FIRST ROUTE EXECUTED (extract-names)");
    console.log(`   Processed ${names.length} names`);

    return [
      {
        version: ctx.version,
        property: "Character_Names",
        file: ctx.file.name,
        entries: [],
      },
    ];
  },
});

const secondRoute = definePipelineRoute({
  id: "extract-categories",
  filter: byName("UnicodeData.txt"),

  parser: async function* (ctx) {
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
    const categories = [];
    for await (const row of rows) {
      categories.push(`${row.codePoint}: ${row.value}`);
    }

    console.log("\n❌ SECOND ROUTE EXECUTED (extract-categories)");
    console.log(`   Processed ${categories.length} categories`);

    return [
      {
        version: ctx.version,
        property: "General_Category",
        file: ctx.file.name,
        entries: [],
      },
    ];
  },
});

async function main() {
  console.log("=== Testing: Two routes with same filter ===\n");
  console.log("Routes defined:");
  console.log("  1. extract-names (filter: UnicodeData.txt)");
  console.log("  2. extract-categories (filter: UnicodeData.txt)");
  console.log("\nExpected: Only first route should execute");

  const pipeline = definePipeline({
    versions: ["16.0.0"],
    inputs: [multipleRoutesSource],
    routes: [firstRoute, secondRoute],
  });

  const result = await pipeline.run();

  console.log("\n=== Results ===");
  console.log(`Outputs: ${result.summary.totalOutputs}`);
  console.log("\nData:");
  for (const output of result.data) {
    const prop = output as { property: string };
    console.log(`  - ${prop.property}`);
  }

  console.log("\n=== Conclusion ===");
  if (result.summary.totalOutputs === 1) {
    console.log("✅ Only the FIRST route executed (routes.find() behavior)");
    console.log("   The second route was ignored even though it matched.");
  } else {
    console.log("❌ Both routes executed (unexpected!)");
  }
}

main().catch(console.error);

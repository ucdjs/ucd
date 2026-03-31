import type { ParseContext, ParsedRow, PropertyJson } from "@ucdjs/pipelines-core";
import {
  byExt,
  byName,
  definePipeline,
  definePipelineRoute,
  filesystemSink,
  pipelineOutputSource,
} from "@ucdjs/pipelines-core";
import { propertyJsonResolver, standardParser } from "@ucdjs/pipelines-presets";
import { colorsSource, sizesSource } from "../shared/sources";

const outputBaseDir = ".tmp/pipeline-playground-outputs";

const publishedColorsRoute = definePipelineRoute({
  id: "published-colors",
  filter: byName("colors.txt"),
  parser: standardParser,
  resolver: propertyJsonResolver,
  outputs: [
    {
      id: "memory-preview",
      path: "preview/{version}/{property:kebab}.json",
    },
    {
      id: "filesystem-archive",
      sink: filesystemSink({ baseDir: outputBaseDir }),
      path: ({ version, routeId, property }) => {
        const propertySlug = toSlug(property ?? "output");
        return `archive/${version}/${routeId}/${propertySlug}.json`;
      },
    },
  ],
});

const dependentSummaryRoute = definePipelineRoute({
  id: "dependent-summary",
  filter: byName("sizes.txt"),
  depends: ["route:published-colors"],
  parser: standardParser,
  resolver: async (ctx, rows) => {
    const values: string[] = [];

    for await (const row of rows) {
      values.push(Array.isArray(row.value) ? row.value.join(", ") : (row.value ?? ""));
    }

    return [
      [
        "Generated after the published-colors dependency completed.",
        `Created at: ${ctx.now()}`,
        `Total entries: ${values.length}`,
        `Values: ${values.join(", ")}`,
      ].join("\n"),
    ];
  },
  outputs: [
    {
      id: "summary-memory",
      format: "text",
      path: "summaries/{version}/{routeId}.txt",
    },
    {
      id: "summary-file",
      format: "text",
      sink: filesystemSink({ baseDir: outputBaseDir }),
      path: ({ version, routeId, file }) => (
        `summaries/${version}/${routeId}-${toSlug(file.name.replace(".txt", ""))}.txt`
      ),
    },
  ],
});

/**
 * Run this pipeline directly in the playground to inspect:
 * - `outputs` instead of legacy `out`
 * - template-based output paths
 * - function-based output paths
 * - memory + filesystem sinks
 * - outputs that can be consumed downstream through pipelineOutputSource(...)
 * - route dependencies that still show up in the execution graph
 */
export const tracedOutputsPipeline = definePipeline({
  id: "traced-outputs",
  name: "Traced Outputs",
  description: "Demonstrates dynamic output tracing with template paths, function paths, downstream-consumable outputs, and a dependent route.",
  versions: ["1.0.0"],
  inputs: [colorsSource, sizesSource],
  routes: [publishedColorsRoute, dependentSummaryRoute],
});

const publishedColorsInput = pipelineOutputSource({
  pipelineId: "traced-outputs",
  outputId: "filesystem-archive",
});

const publishedOutputConsumerRoute = definePipelineRoute({
  id: "published-output-consumer",
  filter: byExt(".json"),
  parser: publishedPropertyJsonParser,
  resolver: async (ctx, rows) => {
    let count = 0;
    let property = "published-output";

    for await (const row of rows) {
      count += 1;
      property = row.property ?? property;
    }

    return [{
      version: ctx.version,
      property: `${property}_consumer_summary`,
      file: ctx.file.name,
      entries: [{
        value: `Consumed ${count} entries from ${ctx.file.path}`,
      }],
      meta: {
        source: "pipeline-output",
      },
    }];
  },
  outputs: [
    {
      id: "consumer-summary",
      sink: filesystemSink({ baseDir: outputBaseDir }),
      path: "consumers/{version}/{file.name}.summary.json",
    },
  ],
});

/**
 * This second pipeline shows the cross-pipeline input pattern.
 * It expects to run in the same executor batch as `tracedOutputsPipeline`,
 * where upstream outputs are exposed as synthetic JSON files.
 */
export const publishedOutputConsumerPipeline = definePipeline({
  id: "published-output-consumer",
  name: "Published Output Consumer",
  description: "Consumes an upstream output from the traced-outputs pipeline through pipelineOutputSource(...).",
  versions: ["1.0.0"],
  inputs: [publishedColorsInput],
  routes: [publishedOutputConsumerRoute],
});

async function* publishedPropertyJsonParser(ctx: ParseContext): AsyncIterable<ParsedRow> {
  const content = await ctx.readContent();
  const payload = JSON.parse(content) as PropertyJson;

  for (const entry of payload.entries) {
    const [start, end] = entry.range?.split("..") ?? [];

    yield {
      sourceFile: payload.file,
      kind: entry.sequence
        ? "sequence"
        : entry.range
          ? "range"
          : "point",
      start,
      end,
      codePoint: entry.codePoint,
      sequence: entry.sequence,
      property: payload.property,
      value: entry.value,
    };
  }
}

function toSlug(value: string): string {
  return value
    .toLowerCase()

    .replaceAll(/[^a-z0-9]+/g, "-")

    .replace(/^-+|-+$/g, "");
}

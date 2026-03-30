import { byName, definePipeline, definePipelineRoute } from "@ucdjs/pipelines-core";
import { propertyJsonResolver, sequenceParser, standardParser } from "@ucdjs/pipelines-presets";
import { groupByInitialResolver, summaryResolver } from "../shared/resolvers";
import { colorsSource, planetsSource, sequencesSource, sizesSource } from "../shared/sources";

/**
 * Output format 1 - Flat scalar entries.
 *
 * The simplest format: one PropertyJson with N entries, each carrying a
 * single `codePoint` (or numeric key) and a scalar string `value`.
 * Uses the preset `propertyJsonResolver` with no configuration.
 */
const flatColorsRoute = definePipelineRoute({
  id: "fmt-flat",
  filter: byName("colors.txt"),
  parser: standardParser,
  resolver: propertyJsonResolver,
  outputs: [{ path: "flat/{property:kebab}.json" }],
});

/**
 * Output format 2 - Scalar entries with a `meta` summary block.
 *
 * Same flat structure as above, but the resolver appends a `meta` object
 * (total count + timestamp). The pipeline-server UI renders this as an
 * extra info panel in the inspect view.
 */
const summaryPlanetsRoute = definePipelineRoute({
  id: "fmt-with-meta",
  filter: byName("planets.txt"),
  parser: standardParser,
  resolver: summaryResolver,
  outputs: [{
    path: "with-meta/{property:lower}.json",
  }],
});

/**
 * Output format 3 - Array-valued entries.
 *
 * Each entry's `value` field is a string array instead of a scalar string.
 * Here every size gets annotated as [label, abbreviation, category].
 * This mirrors properties like Decomposition_Mapping where a single entry
 * maps to an ordered list of values.
 */
const arrayValuesSizesRoute = definePipelineRoute({
  id: "fmt-array-values",
  filter: byName("sizes.txt"),
  parser: standardParser,
  resolver: async (ctx, rows) => {
    const entries: Array<{ codePoint?: string; value: string[] }> = [];

    for await (const row of rows) {
      const abbr = row.codePoint ?? "";
      const label = Array.isArray(row.value) ? row.value.join(", ") : (row.value ?? "");
      // Array value: [full label, abbreviation, category tag]
      entries.push({ codePoint: abbr, value: [label, abbr, "clothing-size"] });
    }

    return [{
      version: ctx.version,
      property: "SizesWithArrayValues",
      file: ctx.file.name,
      entries,
      meta: {
        description: "Each entry carries [full label, abbreviation, category] as an array value",
      },
    }];
  },
  outputs: [{
    path: "array-values/{property}.json",
  }],
});

/**
 * Output format 4 - Sequence entries.
 *
 * Each entry carries a `sequence` array (ordered list of code-point tokens)
 * instead of a single codePoint. Uses the preset `sequenceParser` which
 * splits space-separated tokens in the first field.
 */
const sequencesRoute = definePipelineRoute({
  id: "fmt-sequences",
  filter: byName("sequences.txt"),
  parser: sequenceParser,
  resolver: propertyJsonResolver,
  outputs: [{ path: "sequences/{property:kebab}.json" }],
});

/**
 * Output format 5 - Multi-property grouped output.
 *
 * A single source file fans out into *multiple* PropertyJson objects - one
 * per distinct group key. `groupByInitialResolver` (from shared/resolvers)
 * buckets entries by the first letter of their value, mirroring how
 * General_Category or Script properties produce one blob per category value.
 */
const groupedColorsRoute = definePipelineRoute({
  id: "fmt-grouped",
  filter: byName("colors.txt"),
  parser: standardParser,
  resolver: groupByInitialResolver,
  outputs: [{
    path: "grouped/{property}.json",
  }],
});

export const multipleOutputFormatsPipeline = definePipeline({
  id: "multiple-output-formats",
  name: "Multiple Output Formats",
  description: [
    "Showcases every distinct ResolvedEntry shape the pipeline system supports.",
    "Route fmt-flat → flat scalar entries (propertyJsonResolver).",
    "Route fmt-with-meta → scalar entries + meta summary block.",
    "Route fmt-array-values → entries with string-array values.",
    "Route fmt-sequences → sequence entries (space-separated tokens).",
    "Route fmt-grouped → multi-property fan-out grouped by initial letter.",
  ].join(" "),
  versions: ["1.0.0"],
  inputs: [colorsSource, planetsSource, sizesSource, sequencesSource],
  routes: [
    flatColorsRoute,
    summaryPlanetsRoute,
    arrayValuesSizesRoute,
    sequencesRoute,
    groupedColorsRoute,
  ],
  concurrency: 5,
});

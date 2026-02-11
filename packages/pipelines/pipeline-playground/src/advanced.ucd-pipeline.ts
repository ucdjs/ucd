import type { ParsedRow, PropertyJson, ResolvedEntry } from "@ucdjs/pipelines-core";
import {
  always,
  and,
  byDir,
  byExt,
  byName,
  definePipeline,
  definePipelineRoute,
  definePipelineTransform,
} from "@ucdjs/pipelines-core";
import {
  createDeduplicateTransform,
  createExpandRangesTransform,
  createMemorySource,
  createNormalizeTransform,
  createSortTransform,
  propertyJsonResolver,
  sequenceParser,
  standardParser,
  unicodeDataParser,
} from "@ucdjs/pipelines-presets";

const filterEmptyValues = definePipelineTransform<ParsedRow, ParsedRow>({
  id: "filter-empty-values",
  async* fn(_ctx, rows) {
    for await (const row of rows) {
      if (row.value && row.value !== "" && row.value !== "<none>") {
        yield row;
      }
    }
  },
});

const addMetadata = definePipelineTransform<ParsedRow, ParsedRow>({
  id: "add-metadata",
  async* fn(ctx, rows) {
    for await (const row of rows) {
      yield {
        ...row,
        meta: {
          ...row.meta,
          processedAt: new Date().toISOString(),
          sourceVersion: ctx.version,
        },
      };
    }
  },
});

const unicodeDataRoute = definePipelineRoute({
  id: "unicode-data",
  filter: byName("UnicodeData.txt"),
  parser: unicodeDataParser,
  transforms: [
    createExpandRangesTransform(),
    addMetadata,
  ],
  resolver: propertyJsonResolver,
  out: {
    fileName: (pj: PropertyJson) => `properties/${pj.property.toLowerCase().replace(/_/g, "-")}.json`,
  },
});

const blocksRoute = definePipelineRoute({
  id: "blocks",
  filter: byName("Blocks.txt"),
  parser: standardParser,
  transforms: [
    createSortTransform({ direction: "asc" }),
  ],
  resolver: async (ctx, rows) => {
    const entries: ResolvedEntry[] = [];

    for await (const row of rows) {
      const range = row.start && row.end ? `${row.start}..${row.end}` : undefined;
      entries.push({
        range: range as `${string}..${string}` | undefined,
        codePoint: row.codePoint,
        value: row.value,
      });
    }

    return [{
      version: ctx.version,
      property: "Blocks",
      file: "Blocks.txt",
      entries,
    }];
  },
});

const scriptsRoute = definePipelineRoute({
  id: "scripts",
  filter: byName("Scripts.txt"),
  depends: ["route:blocks"] as unknown as readonly ["route:blocks"],
  parser: standardParser,
  resolver: async (ctx, rows) => {
    const entries: ResolvedEntry[] = [];

    for await (const row of rows) {
      const range = row.start && row.end ? `${row.start}..${row.end}` : undefined;
      entries.push({
        range: range as `${string}..${string}` | undefined,
        codePoint: row.codePoint,
        value: row.value,
      });
    }

    return [{
      version: ctx.version,
      property: "Scripts",
      file: "Scripts.txt",
      entries,
    }];
  },
});

const lineBreakRoute = definePipelineRoute({
  id: "line-break",
  filter: byName("LineBreak.txt"),
  depends: ["route:unicode-data"] as unknown as readonly ["route:unicode-data"],
  parser: standardParser,
  transforms: [
    createNormalizeTransform(),
    createSortTransform({ direction: "asc" }),
  ],
  resolver: propertyJsonResolver,
  cache: true,
});

const propListRoute = definePipelineRoute({
  id: "prop-list",
  filter: byName("PropList.txt"),
  parser: standardParser,
  transforms: [
    filterEmptyValues,
    createDeduplicateTransform({ strategy: "first" }),
  ],
  resolver: async (ctx, rows) => {
    const propertyGroups = new Map<string, ResolvedEntry[]>();

    for await (const row of rows) {
      const prop = row.property || "Unknown";
      if (!propertyGroups.has(prop)) {
        propertyGroups.set(prop, []);
      }
      const entries = propertyGroups.get(prop)!;
      const range = row.start && row.end ? `${row.start}..${row.end}` : undefined;
      entries.push({
        range: range as `${string}..${string}` | undefined,
        codePoint: row.codePoint,
        value: true,
      });
    }

    return Array.from(propertyGroups.entries()).map(([property, entries]) => ({
      version: ctx.version,
      property,
      file: "PropList.txt",
      entries,
    }));
  },
});

const sequencesRoute = definePipelineRoute({
  id: "sequences",
  filter: byName("Sequences.txt"),
  parser: sequenceParser,
  resolver: propertyJsonResolver,
});

const emojiDataRoute = definePipelineRoute({
  id: "emoji-data",
  filter: and(byDir("emoji"), byExt(".txt")),
  depends: ["route:prop-list"] as unknown as readonly ["route:prop-list"],
  parser: standardParser,
  resolver: async (ctx, rows) => {
    const entries: ResolvedEntry[] = [];

    for await (const row of rows) {
      const range = row.start && row.end ? `${row.start}..${row.end}` : undefined;
      entries.push({
        range: range as `${string}..${string}` | undefined,
        codePoint: row.codePoint,
        sequence: row.sequence,
        value: row.value,
      });
    }

    return [{
      version: ctx.version,
      property: `Emoji_${ctx.file.name.replace(".txt", "")}`,
      file: ctx.file.path,
      entries,
      meta: {
        emojiVersion: "16.0",
      },
    }];
  },
});

const ucdGeneralRoute = definePipelineRoute({
  id: "ucd-general",
  filter: and(byDir("ucd"), byExt(".txt")),
  parser: standardParser,
  resolver: propertyJsonResolver,
});

const auxiliaryRoute = definePipelineRoute({
  id: "auxiliary",
  filter: byDir("auxiliary"),
  depends: ["route:unicode-data", "route:blocks"] as unknown as readonly ["route:unicode-data", "route:blocks"],
  parser: standardParser,
  transforms: [
    createSortTransform({ direction: "asc" }),
  ],
  resolver: propertyJsonResolver,
});

const extractedRoute = definePipelineRoute({
  id: "extracted",
  filter: byDir("extracted"),
  parser: standardParser,
  resolver: propertyJsonResolver,
});

export const playgroundAdvancedPipeline = definePipeline({
  id: "playground-advanced",
  name: "Advanced Pipeline Playground",
  description: "A comprehensive pipeline demonstrating all available features including dependencies, artifacts, transforms, and multiple sources",
  versions: ["15.1.0", "16.0.0"],
  inputs: [
    createMemorySource({
      id: "test-data",
      files: {
        "16.0.0": [
          {
            path: "ucd/UnicodeData.txt",
            content: `0041;LATIN CAPITAL LETTER A;Lu;0;L;;;;;N;;;;0061;
0042;LATIN CAPITAL LETTER B;Lu;0;L;;;;;N;;;;0062;
0061;LATIN SMALL LETTER A;Ll;0;L;;;;;N;;;0041;;0041
0062;LATIN SMALL LETTER B;Ll;0;L;;;;;N;;;0042;;0042`,
          },
          {
            path: "ucd/Blocks.txt",
            content: `0000..007F; Basic Latin
0080..00FF; Latin-1 Supplement`,
          },
          {
            path: "ucd/Scripts.txt",
            content: `0000..007F; Latin
0080..00FF; Latin`,
          },
          {
            path: "ucd/LineBreak.txt",
            content: `0000..0008; CM
0009; BA
000A; LF`,
          },
          {
            path: "ucd/PropList.txt",
            content: `0000..001F; Control
007F..009F; Control`,
          },
          {
            path: "ucd/Sequences.txt",
            content: `0041 0308; A_WITH_DIAERESIS
0061 0308; a_WITH_DIAERESIS`,
          },
        ],
        "15.1.0": [
          {
            path: "ucd/UnicodeData.txt",
            content: `0041;LATIN CAPITAL LETTER A;Lu;0;L;;;;;N;;;;0061;
0061;LATIN SMALL LETTER A;Ll;0;L;;;;;N;;;0041;;0041`,
          },
          {
            path: "ucd/Blocks.txt",
            content: `0000..007F; Basic Latin`,
          },
        ],
      },
    }),
    createMemorySource({
      id: "emoji-data",
      files: {
        "16.0.0": [
          {
            path: "emoji/emoji-data.txt",
            content: `231A..231B; Emoji
23E9..23EC; Emoji`,
          },
          {
            path: "emoji/emoji-sequences.txt",
            content: `231A..231B; Emoji; Watch
23E9..23EC; Emoji; Arrow`,
          },
        ],
      },
    }),
  ],
  routes: [
    unicodeDataRoute,
    blocksRoute,
    scriptsRoute,
    lineBreakRoute,
    propListRoute,
    sequencesRoute,
    emojiDataRoute,
    ucdGeneralRoute,
    auxiliaryRoute,
    extractedRoute,
  ],
  include: byExt(".txt"),
  strict: false,
  concurrency: 8,
  fallback: {
    filter: always(),
    parser: async function* (ctx) {
      const content = await ctx.readContent();
      yield {
        sourceFile: ctx.file.path,
        kind: "point" as const,
        value: `fallback: ${content.length} bytes`,
      };
    },
    resolver: async (ctx, rows) => {
      const entries: ResolvedEntry[] = [];
      for await (const row of rows) {
        entries.push({
          codePoint: "0000",
          value: row.value,
        });
      }
      return [{
        version: ctx.version,
        property: "Fallback",
        file: ctx.file.name,
        entries,
      }];
    },
  },
  onEvent: (event) => {
    switch (event.type) {
      case "pipeline:start":
        console.log(`[Pipeline] Started: ${event.id}`);
        break;
      case "pipeline:end":
        console.log(`[Pipeline] Completed in ${event.durationMs}ms`);
        break;
      case "version:start":
        console.log(`[Version] Processing ${event.version}`);
        break;
      case "version:end":
        console.log(`[Version] ${event.version} completed in ${event.durationMs}ms`);
        break;
      case "file:matched":
        console.log(`[File] Matched ${event.file.path} -> ${event.routeId}`);
        break;
      case "file:skipped":
        console.log(`[File] Skipped ${event.file.path}: ${event.reason}`);
        break;
      case "artifact:produced":
        console.log(`[Artifact] Produced ${event.artifactId} from ${event.routeId}`);
        break;
      case "artifact:consumed":
        console.log(`[Artifact] Consumed ${event.artifactId} by ${event.routeId}`);
        break;
      case "error":
        console.error(`[Error] ${event.error.scope}: ${event.error.message}`);
        break;
    }
  },
});

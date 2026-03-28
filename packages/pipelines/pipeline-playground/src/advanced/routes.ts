import type { ResolvedEntry } from "@ucdjs/pipelines-core";
import { and, byDir, byExt, byName, definePipelineRoute } from "@ucdjs/pipelines-core";
import {
  createDeduplicateTransform,
  createExpandRangesTransform,
  createNormalizeTransform,
  createSortTransform,
} from "@ucdjs/pipelines-core/transforms";
import {
  propertyJsonResolver,
  sequenceParser,
  standardParser,
  unicodeDataParser,
} from "@ucdjs/pipelines-presets";
import { addMetadata, filterEmptyValues } from "./transforms";

export const unicodeDataRoute = definePipelineRoute({
  id: "unicode-data",
  filter: byName("UnicodeData.txt"),
  parser: unicodeDataParser,
  transforms: [
    createExpandRangesTransform(),
    addMetadata,
  ],
  resolver: propertyJsonResolver,
  outputs: [{
    path: "properties/{property:kebab}.json",
  }],
});

export const blocksRoute = definePipelineRoute({
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
        value: row.value ?? "",
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

export const scriptsRoute = definePipelineRoute({
  id: "scripts",
  filter: byName("Scripts.txt"),
  depends: ["route:blocks"],
  parser: standardParser,
  resolver: async (ctx, rows) => {
    const entries: ResolvedEntry[] = [];

    for await (const row of rows) {
      const range = row.start && row.end ? `${row.start}..${row.end}` : undefined;
      entries.push({
        range: range as `${string}..${string}` | undefined,
        codePoint: row.codePoint,
        value: row.value ?? "",
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

export const lineBreakRoute = definePipelineRoute({
  id: "line-break",
  filter: byName("LineBreak.txt"),
  depends: ["route:unicode-data"],
  parser: standardParser,
  transforms: [
    createNormalizeTransform(),
    createSortTransform({ direction: "asc" }),
  ],
  resolver: propertyJsonResolver,
  cache: true,
});

export const propListRoute = definePipelineRoute({
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
        value: row.value ?? "",
      });
    }

    return Array.from(propertyGroups.entries(), ([property, entries]) => ({
      version: ctx.version,
      property,
      file: "PropList.txt",
      entries,
    }));
  },
});

export const sequencesRoute = definePipelineRoute({
  id: "sequences",
  filter: byName("Sequences.txt"),
  parser: sequenceParser,
  resolver: propertyJsonResolver,
});

export const emojiDataRoute = definePipelineRoute({
  id: "emoji-data",
  filter: and(byDir("emoji"), byExt(".txt")),
  depends: ["route:prop-list"],
  parser: standardParser,
  resolver: async (ctx, rows) => {
    const entries: ResolvedEntry[] = [];

    for await (const row of rows) {
      const range = row.start && row.end ? `${row.start}..${row.end}` : undefined;
      entries.push({
        range: range as `${string}..${string}` | undefined,
        codePoint: row.codePoint,
        sequence: row.sequence,
        value: row.value ?? "",
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

export const ucdGeneralRoute = definePipelineRoute({
  id: "ucd-general",
  filter: and(byDir("ucd"), byExt(".txt")),
  parser: standardParser,
  resolver: propertyJsonResolver,
});

export const auxiliaryRoute = definePipelineRoute({
  id: "auxiliary",
  filter: byDir("auxiliary"),
  depends: ["route:unicode-data", "route:blocks"],
  parser: standardParser,
  transforms: [
    createSortTransform({ direction: "asc" }),
  ],
  resolver: propertyJsonResolver,
});

export const extractedRoute = definePipelineRoute({
  id: "extracted",
  filter: byDir("extracted"),
  parser: standardParser,
  resolver: propertyJsonResolver,
});

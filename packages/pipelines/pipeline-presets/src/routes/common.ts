import {
  byGlob,
  byName,
  definePipelineRoute,

} from "@ucdjs/pipelines-core";
import { standardParser } from "../parsers/standard";
import { unicodeDataParser } from "../parsers/unicode-data";
import { createGroupedResolver } from "../resolvers/grouped";
import { propertyJsonResolver } from "../resolvers/property-json";
import { normalizeCodePoints } from "../transforms/normalize";
import { sortByCodePoint } from "../transforms/sort";

export const lineBreakRoute = definePipelineRoute({
  id: "line-break",
  filter: byName("LineBreak.txt"),
  parser: standardParser,
  transforms: [normalizeCodePoints, sortByCodePoint],
  resolver: propertyJsonResolver,
});

export const scriptsRoute = definePipelineRoute({
  id: "scripts",
  filter: byName("Scripts.txt"),
  parser: standardParser,
  transforms: [normalizeCodePoints, sortByCodePoint],
  resolver: propertyJsonResolver,
});

export const blocksRoute = definePipelineRoute({
  id: "blocks",
  filter: byName("Blocks.txt"),
  parser: standardParser,
  transforms: [normalizeCodePoints, sortByCodePoint],
  resolver: propertyJsonResolver,
});

export const generalCategoryRoute = definePipelineRoute({
  id: "general-category",
  filter: byName("extracted/DerivedGeneralCategory.txt"),
  parser: standardParser,
  transforms: [normalizeCodePoints, sortByCodePoint],
  resolver: propertyJsonResolver,
});

export const propListRoute = definePipelineRoute({
  id: "prop-list",
  filter: byName("PropList.txt"),
  parser: standardParser,
  transforms: [normalizeCodePoints, sortByCodePoint],
  resolver: createGroupedResolver({
    groupBy: "value",
    propertyNameFn: (value) => value,
  }),
});

export const derivedCorePropertiesRoute = definePipelineRoute({
  id: "derived-core-properties",
  filter: byName("DerivedCoreProperties.txt"),
  parser: standardParser,
  transforms: [normalizeCodePoints, sortByCodePoint],
  resolver: createGroupedResolver({
    groupBy: "value",
    propertyNameFn: (value) => value,
  }),
});

export const emojiDataRoute = definePipelineRoute({
  id: "emoji-data",
  filter: byGlob("emoji/emoji-data.txt"),
  parser: standardParser,
  transforms: [normalizeCodePoints, sortByCodePoint],
  resolver: createGroupedResolver({
    groupBy: "value",
    propertyNameFn: (value) => `Emoji_${value}`,
  }),
});

export const unicodeDataRoute = definePipelineRoute({
  id: "unicode-data",
  filter: byName("UnicodeData.txt"),
  parser: unicodeDataParser,
  transforms: [normalizeCodePoints],
  resolver: propertyJsonResolver,
});

export const coreRoutes = [
  lineBreakRoute,
  scriptsRoute,
  blocksRoute,
  generalCategoryRoute,
  propListRoute,
  derivedCorePropertiesRoute,
  unicodeDataRoute,
] as const;

export const emojiRoutes = [
  emojiDataRoute,
] as const;

export const allRoutes = [
  ...coreRoutes,
  ...emojiRoutes,
] as const;

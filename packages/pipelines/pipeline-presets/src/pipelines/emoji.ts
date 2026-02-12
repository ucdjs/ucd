import type { ParsedRow, PropertyJson, ResolveContext } from "@ucdjs/pipelines-core";
import { and, byDir, byExt, definePipeline } from "@ucdjs/pipelines-core";
import { sequenceParser } from "../parsers/sequence";
import { createPropertyJsonResolver } from "../resolvers/property-json";
import { emojiRoutes } from "../routes/common";

export interface EmojiPipelineOptions {
  id?: string;
  versions: string[];
  concurrency?: number;
  strict?: boolean;
}

// eslint-disable-next-line ts/explicit-function-return-type
export function createEmojiPipeline(options: EmojiPipelineOptions) {
  const {
    id = "emoji",
    versions,
    concurrency = 4,
    strict = false,
  } = options;

  const resolver = createPropertyJsonResolver();

  return definePipeline({
    id,
    name: "Emoji Pipeline",
    description: "Processes Unicode emoji data files",
    versions,
    inputs: [],
    routes: [...emojiRoutes],
    include: and(byDir("emoji"), byExt(".txt")),
    concurrency,
    strict,
    fallback: {
      parser: sequenceParser,
      resolver: resolver as (ctx: ResolveContext, rows: AsyncIterable<ParsedRow>) => Promise<PropertyJson[]>,
    },
  });
}

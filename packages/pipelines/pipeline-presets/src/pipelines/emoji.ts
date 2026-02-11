import { and, byDir, byExt, definePipeline } from "@ucdjs/pipelines-core";
import { sequenceParser } from "../parsers/sequence";
import { propertyJsonResolver } from "../resolvers/property-json";
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
      resolver: propertyJsonResolver,
    },
  });
}

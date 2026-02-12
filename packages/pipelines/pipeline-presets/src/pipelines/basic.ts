import type { ParsedRow, PropertyJson, ResolveContext } from "@ucdjs/pipelines-core";
import { byExt, definePipeline } from "@ucdjs/pipelines-core";
import { standardParser } from "../parsers/standard";
import { createPropertyJsonResolver } from "../resolvers/property-json";
import { coreRoutes } from "../routes/common";

export interface BasicPipelineOptions {
  id?: string;
  versions: string[];
  concurrency?: number;
  strict?: boolean;
}

// eslint-disable-next-line ts/explicit-function-return-type
export function createBasicPipeline(options: BasicPipelineOptions) {
  const {
    id = "basic-ucd",
    versions,
    concurrency = 4,
    strict = false,
  } = options;

  const resolver = createPropertyJsonResolver();

  return definePipeline({
    id,
    name: "Basic UCD Pipeline",
    description: "Processes core Unicode Character Database files",
    versions,
    inputs: [],
    routes: [...coreRoutes],
    include: byExt(".txt"),
    concurrency,
    strict,
    fallback: {
      parser: standardParser,
      resolver: resolver as (ctx: ResolveContext, rows: AsyncIterable<ParsedRow>) => Promise<PropertyJson[]>,
    },
  });
}

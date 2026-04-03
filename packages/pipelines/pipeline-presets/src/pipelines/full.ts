import type { ParsedRow, PropertyJson, ResolveContext } from "@ucdjs/pipeline-core";
import { byExt, definePipeline } from "@ucdjs/pipeline-core";
import { standardParser } from "../parsers/standard";
import { createPropertyJsonResolver } from "../resolvers/property-json";
import { allRoutes } from "../routes/common";

export interface FullPipelineOptions {
  id?: string;
  versions: string[];
  concurrency?: number;
  strict?: boolean;
}

// eslint-disable-next-line ts/explicit-function-return-type
export function createFullPipeline(options: FullPipelineOptions) {
  const {
    id = "full-ucd",
    versions,
    concurrency = 4,
    strict = false,
  } = options;

  const resolver = createPropertyJsonResolver();

  return definePipeline({
    id,
    name: "Full UCD Pipeline",
    description: "Processes all Unicode Character Database files",
    versions,
    inputs: [],
    routes: [...allRoutes],
    include: byExt(".txt"),
    concurrency,
    strict,
    fallback: {
      parser: standardParser,
      resolver: resolver as (ctx: ResolveContext, rows: AsyncIterable<ParsedRow>) => Promise<PropertyJson[]>,
    },
  });
}

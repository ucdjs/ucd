import type { PipelineDefinition } from "@ucdjs/pipelines-core";
import { byExt, definePipeline } from "@ucdjs/pipelines-core";
import { standardParser } from "../parsers/standard";
import { propertyJsonResolver } from "../resolvers/property-json";
import { coreRoutes } from "../routes/common";

export interface BasicPipelineOptions {
  id?: string;
  versions: string[];
  concurrency?: number;
  strict?: boolean;
}

export function createBasicPipeline(options: BasicPipelineOptions) {
  const {
    id = "basic-ucd",
    versions,
    concurrency = 4,
    strict = false,
  } = options;

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
      resolver: propertyJsonResolver,
    },
  });
}

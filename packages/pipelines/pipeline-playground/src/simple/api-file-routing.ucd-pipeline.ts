import type { ResolvedEntry } from "@ucdjs/pipeline-core";
import HTTPFileSystemBackend from "@ucdjs/fs-backend/backends/http";
import { byName, definePipeline, definePipelineRoute, definePipelineSource } from "@ucdjs/pipeline-core";
import { propertyJsonResolver, standardParser } from "@ucdjs/pipeline-presets";

const apiSource = definePipelineSource({
  id: "api-files",
  backend: HTTPFileSystemBackend({
    // baseUrl: "https://api.ucdjs.dev/api/v1/files",
    baseUrl: "http://localhost:8787/api/v1/files",
  }),
});

const ageRoute = definePipelineRoute({
  id: "derived-age",
  filter: byName("DerivedAge.txt"),
  parser: standardParser,
  resolver: propertyJsonResolver,
});

const scriptsRoute = definePipelineRoute({
  id: "scripts",
  filter: byName("Scripts.txt"),
  parser: standardParser,
  resolver: async (ctx, rows) => {
    const entries: ResolvedEntry[] = [];
    for await (const row of rows) {
      if (row.value != null) {
        entries.push({ codePoint: row.codePoint, value: row.value });
      }
    }
    return [{
      version: ctx.version,
      property: "Script",
      file: ctx.file.name,
      entries,
    }];
  },
});

export const apiFileRoutingPipeline = definePipeline({
  id: "api-file-routing",
  name: "API File Routing",
  versions: ["16.0.0"],
  inputs: [apiSource],
  routes: [ageRoute, scriptsRoute],
});

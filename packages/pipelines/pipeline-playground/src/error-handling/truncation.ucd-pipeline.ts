import { byName, definePipeline, definePipelineRoute } from "@ucdjs/pipeline-core";
import { standardParser } from "@ucdjs/pipeline-presets";
import { colorsSource } from "../shared/sources";

// eslint-disable-next-line ts/explicit-function-return-type
function createLargeLogRoute(id: string, sizeKB: number) {
  const payload = "x".repeat(sizeKB * 1024);

  return definePipelineRoute({
    id,
    filter: (ctx) => byName("colors.txt")(ctx),
    parser: standardParser,
    resolver: async (ctx, rows) => {
      ctx.logger.warn("About to log a very large message that will be truncated by the server");
      ctx.logger.info(`Huge payload incoming: ${payload}`);
      ctx.logger.info("This line comes after the huge log - it may not be stored if total limit is hit");

      const entries = [];
      for await (const row of rows) {
        if (row.value) {
          entries.push({ codePoint: row.codePoint, value: row.value });
        }
      }

      return [{ version: ctx.version, property: "Colors", file: ctx.file.name, entries }];
    },
  });
}

export const truncationPipeline = definePipeline({
  id: "truncation",
  name: "Truncation Demo",
  versions: ["1.0.0"],
  inputs: [colorsSource],
  routes: [createLargeLogRoute("truncation-route", 500)],
});

export const payloadTooLargePipeline = definePipeline({
  id: "too-large",
  name: "Payload Too Large Demo",
  versions: ["1.0.0"],
  inputs: [colorsSource],
  routes: [createLargeLogRoute("payload-too-large-route", 50_000)],
});

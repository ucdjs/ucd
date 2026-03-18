import { byName, definePipeline, definePipelineRoute } from "@ucdjs/pipelines-core";
import { standardParser } from "@ucdjs/pipelines-presets";
import { sharedSource } from "./shared";

// MAX_LINE_BYTES in the server is 256KB — generate something well above that.
const HUGE_STRING = "x".repeat(50000 * 1024);

const payloadTooLargeRoute = definePipelineRoute({
  id: "payload-too-large-route",
  filter: (ctx) => byName("colors.txt")(ctx),
  parser: standardParser,
  resolver: async (ctx, rows) => {
    ctx.logger.warn("About to log a very large message that will be truncated by the server");
    ctx.logger.info(`Huge payload incoming: ${HUGE_STRING}`);
    ctx.logger.info("This line comes after the huge log — it may not be stored if total limit is hit");

    const entries = [];
    for await (const row of rows) {
      if (row.value) {
        entries.push({ codePoint: row.codePoint, value: row.value });
      }
    }

    return [{ version: ctx.version, property: "Colors", file: ctx.file.name, entries }];
  },
});

export const payloadTooLargePipeline = definePipeline({
  id: "too-large",
  name: "Payload Too Large Demo",
  versions: ["1.0.0"],
  inputs: [sharedSource],
  routes: [payloadTooLargeRoute],
});

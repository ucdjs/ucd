import z from "zod";

export const PipelineInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  versions: z.array(z.string()),
  routeCount: z.number(),
  sourceCount: z.number(),
  sourceId: z.string(),
});

const PipelineRouteDependencySchema = z.object({
  type: z.literal("route"),
  routeId: z.string(),
});

const PipelineRouteOutputSchema = z.object({
  id: z.string(),
  sink: z.string(),
  format: z.enum(["json", "text"]),
  path: z.string().optional(),
  dynamicPath: z.boolean().default(false),
  pathSource: z.string().optional(),
  dir: z.string().optional(),
  fileName: z.string().optional(),
});

const PipelineRouteSchema = z.object({
  id: z.string(),
  cache: z.boolean(),
  depends: z.array(PipelineRouteDependencySchema),
  filter: z.string().optional(),
  outputs: z.array(PipelineRouteOutputSchema),
  transforms: z.array(z.string()),
});

export const PipelineDetailsSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  include: z.string().optional(),
  versions: z.array(z.string()),
  routeCount: z.number(),
  sourceCount: z.number(),
  routes: z.array(PipelineRouteSchema),
  sources: z.array(z.object({ id: z.string() })),
});

export type PipelineInfo = z.infer<typeof PipelineInfoSchema>;
export type PipelineDetails = z.infer<typeof PipelineDetailsSchema>;

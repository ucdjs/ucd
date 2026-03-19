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

const PipelineRouteDependencySchema = z.union([
  z.object({
    type: z.literal("route"),
    routeId: z.string(),
  }),
  z.object({
    type: z.literal("artifact"),
    routeId: z.string(),
    artifactName: z.string(),
  }),
]);

const PipelineRouteEmitSchema = z.object({
  id: z.string(),
  scope: z.enum(["version", "global"]),
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
  emits: z.array(PipelineRouteEmitSchema),
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

export const PipelineResponseSchema = z.object({
  pipeline: PipelineDetailsSchema,
});

export type PipelineInfo = z.infer<typeof PipelineInfoSchema>;
export type PipelineDetails = z.infer<typeof PipelineDetailsSchema>;
export type PipelineResponse = z.infer<typeof PipelineResponseSchema>;

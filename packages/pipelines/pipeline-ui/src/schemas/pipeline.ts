import { z } from "zod";

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
export type PipelineInfo = z.infer<typeof PipelineInfoSchema>;

export const PipelineRouteSchema = z.object({
  id: z.string(),
  cache: z.boolean(),
  depends: z.array(z.any()),
  emits: z.array(z.object({
    id: z.string(),
    scope: z.enum(["version", "global"]),
  })),
  outputs: z.array(z.object({
    dir: z.string().optional(),
    fileName: z.string().optional(),
  })),
  transforms: z.array(z.string()),
});

export const PipelineDetailsSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  versions: z.array(z.string()),
  routeCount: z.number(),
  sourceCount: z.number(),
  routes: z.array(PipelineRouteSchema),
  sources: z.array(z.object({ id: z.string() })),
});
export type PipelineDetails = z.infer<typeof PipelineDetailsSchema>;

export const PipelineResponseSchema = z.object({
  pipeline: PipelineDetailsSchema.optional(),
  error: z.string().optional(),
  fileId: z.string().optional(),
  filePath: z.string().optional(),
  fileLabel: z.string().optional(),
  sourceId: z.string().optional(),
});
export type PipelineResponse = z.infer<typeof PipelineResponseSchema>;

export const CodeResponseSchema = z.object({
  code: z.string().optional(),
  filePath: z.string().optional(),
  fileLabel: z.string().optional(),
  fileId: z.string().optional(),
  sourceId: z.string().optional(),
  error: z.string().optional(),
});
export type CodeResponse = z.infer<typeof CodeResponseSchema>;

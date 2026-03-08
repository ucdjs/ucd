import { PipelineInfoSchema } from "./pipeline";
import z from "zod";

export const SourceFileResponseSchema = z.object({
  id: z.string(),
  path: z.string(),
  label: z.string(),
  sourceId: z.string(),
  pipelines: z.array(PipelineInfoSchema),
});

export type SourceFileResponse = z.infer<typeof SourceFileResponseSchema>;

import z from "zod";
import { PipelineInfoSchema } from "./pipeline";

export const SourceFileResponseSchema = z.object({
  id: z.string(),
  path: z.string(),
  label: z.string(),
  sourceId: z.string(),
  pipelines: z.array(PipelineInfoSchema),
});

export type SourceFileResponse = z.infer<typeof SourceFileResponseSchema>;

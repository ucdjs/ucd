import type { PipelineGraphEdgeType, PipelineGraphNodeType } from "@ucdjs/pipelines-core/tracing";
import z from "zod";

export const GraphDetailFieldTypeSchema = z.enum(["text", "json", "content"]);

export const ExecutionGraphDetailFieldSchema = z.object({
  label: z.string(),
  type: GraphDetailFieldTypeSchema,
  value: z.unknown(),
});

export const ExecutionGraphNodeActionSchema = z.object({
  label: z.string(),
  to: z.string(),
  params: z.record(z.string(), z.string()),
  search: z.record(z.string(), z.string().optional()).optional(),
});

export const ExecutionGraphNodeViewSchema = z.object({
  id: z.string(),
  nodeType: z.custom<PipelineGraphNodeType>(() => true),
  flowType: z.string(),
  label: z.string(),
  detailFields: z.array(ExecutionGraphDetailFieldSchema),
  actions: z.array(ExecutionGraphNodeActionSchema).optional(),
});

export const ExecutionGraphEdgeViewSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  label: z.string(),
  edgeType: z.custom<PipelineGraphEdgeType>(() => true),
});

export const ExecutionGraphViewSchema = z.object({
  nodes: z.array(ExecutionGraphNodeViewSchema),
  edges: z.array(ExecutionGraphEdgeViewSchema),
});

export type GraphDetailFieldType = z.infer<typeof GraphDetailFieldTypeSchema>;
export type ExecutionGraphDetailField = z.infer<typeof ExecutionGraphDetailFieldSchema>;
export type ExecutionGraphNodeAction = z.infer<typeof ExecutionGraphNodeActionSchema>;
export type ExecutionGraphNodeView = z.infer<typeof ExecutionGraphNodeViewSchema>;
export type ExecutionGraphEdgeView = z.infer<typeof ExecutionGraphEdgeViewSchema>;
export type ExecutionGraphView = z.infer<typeof ExecutionGraphViewSchema>;

import z from "zod";

export const LiveReadyEventSchema = z.object({
  type: z.literal("ready"),
  workspaceId: z.string(),
  occurredAt: z.string(),
});

export const SourceChangeSchema = z.object({
  kind: z.enum(["add", "change", "unlink"]),
  path: z.string(),
});

export const SourceChangedEventSchema = z.object({
  type: z.literal("source.changed"),
  sourceId: z.string(),
  changes: z.array(SourceChangeSchema),
  occurredAt: z.string(),
});

export const LiveEventSchema = z.discriminatedUnion("type", [
  LiveReadyEventSchema,
  SourceChangedEventSchema,
]);

export type LiveReadyEvent = z.infer<typeof LiveReadyEventSchema>;
export type SourceChange = z.infer<typeof SourceChangeSchema>;
export type SourceChangedEvent = z.infer<typeof SourceChangedEventSchema>;
export type LiveEvent = z.infer<typeof LiveEventSchema>;

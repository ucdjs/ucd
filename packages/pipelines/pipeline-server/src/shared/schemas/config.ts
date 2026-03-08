import z from "zod";

export const ConfigSchema = z.object({
  workspaceId: z.string(),
  version: z.string(),
});

export type Config = z.infer<typeof ConfigSchema>;

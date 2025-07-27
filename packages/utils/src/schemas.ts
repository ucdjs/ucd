import z from "zod";

export const BaseItemSchema = z.object({
  name: z.string(),
  path: z.string(),
  lastModified: z.number(),
});

export const DirectoryResponseSchema = BaseItemSchema.extend({
  type: z.literal("directory"),
});

export const FileResponseSchema = BaseItemSchema.extend({
  type: z.literal("file"),
});

export const FileEntrySchema = z.union([
  DirectoryResponseSchema,
  FileResponseSchema,
]);

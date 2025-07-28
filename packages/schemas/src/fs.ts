import { dedent } from "@luxass/utils";
import z from "zod";

const BaseItemSchema = z.object({
  name: z.string(),
  path: z.string(),
  lastModified: z.number(),
});

const DirectoryResponseSchema = BaseItemSchema.extend({
  type: z.literal("directory"),
});

const FileResponseSchema = BaseItemSchema.extend({
  type: z.literal("file"),
});

export const FileEntrySchema = z.union([
  DirectoryResponseSchema,
  FileResponseSchema,
]).meta({
  id: "FileEntry",
  description: dedent`
    Response schema for a file entry in the UCD store.

    This schema represents either a directory listing or a file response.
  `,
});

import { z } from "@hono/zod-openapi";
import { dedent } from "@luxass/utils";

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

export const RawResponseSchema = z.union([
  DirectoryResponseSchema,
  FileResponseSchema,
]).openapi("RawResponse", {
  description: dedent`
    Response schema for the raw Unicode data proxy endpoint.

    This schema represents either a directory listing or a file response.
  `,
});

const BaseMetadataSchema = z.object({
  mtime: z.string().openapi({
    description: "Last modified time in ISO 8601 format (e.g., '2023-09-15T10:30:00Z')",
  }),
});

const FileMetadataSchema = BaseMetadataSchema.extend({
  type: z.literal("file"),
  size: z.number().optional().openapi({
    description: "Size of the file in bytes. Only present for files, not directories.",
  }),
});

const DirectoryMetadataSchema = BaseMetadataSchema.extend({
  type: z.literal("directory"),
});

export const RawMetadataSchema = z.union([FileMetadataSchema, DirectoryMetadataSchema]).openapi("Metadata", {
  description: dedent`
    Metadata about a file or directory in the Unicode data repository.

    Provides essential information such as type, last modified time, and size (for files).
  `,
  examples: [
    {
      type: "file",
      mtime: "2023-09-15T10:30:00Z",
      size: 1889024,
    },
    {
      type: "directory",
      mtime: "2023-09-15T10:30:00Z",
    },
  ],
});

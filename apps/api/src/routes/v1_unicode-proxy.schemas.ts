import { z } from "@hono/zod-openapi";
import { dedent } from "@luxass/utils";

const DirectoryResponseSchema = z.object({
  type: z.literal("directory"),
  name: z.string(),
  path: z.string(),
  lastModified: z.string(),
}).openapi("ProxyDirectoryResponse");

export const FileResponseSchema = z.object({
  type: z.literal("file"),
  name: z.string(),
  path: z.string(),
  lastModified: z.string().optional(),
}).openapi("ProxyFileResponse");

export const ProxyResponseSchema = z.union([
  DirectoryResponseSchema,
  FileResponseSchema,
]).openapi("ProxyResponse");

export const ProxyMetadataSchema = z.object({
  type: z.enum(["file", "directory"]).openapi({
    description: "Type of the resource - either a file or directory",
  }),
  mtime: z.string().openapi({
    description: "Last modified time in ISO 8601 format (e.g., '2023-09-15T10:30:00Z')",
  }),
  size: z.number().optional().openapi({
    description: "Size of the file in bytes. Only present for files, not directories.",
  }),
}).openapi("ProxyMetadata", {
  description: dedent`
    Metadata about a file or directory in the Unicode data repository.

    Provides essential information such as type, last modified time, and size (for files).
  `,
  examples: [
    {
      summary: "File Metadata",
      value: {
        type: "file",
        mtime: "2023-09-15T10:30:00Z",
        size: 1889024,
      },
      description: "Example metadata for a file",
    },
    {
      summary: "Directory Metadata",
      value: {
        type: "directory",
        mtime: "2023-09-15T10:30:00Z",
        size: 0,
      },
      description: "Example metadata for a directory",
    },
  ],
});

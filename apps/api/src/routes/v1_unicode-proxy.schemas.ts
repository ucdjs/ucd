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

const ProxyFileMetadataSchema = z.object({
  type: z.literal("file"),
  mtime: z.string().openapi({
    description: "Last modified time in ISO 8601 format (e.g., '2023-09-15T10:30:00Z')",
  }),
  size: z.number().optional().openapi({
    description: "Size of the file in bytes. Only present for files, not directories.",
  }),
});

const ProxyDirectoryMetadataSchema = z.object({
  type: z.literal("directory"),
  mtime: z.string().openapi({
    description: "Last modified time in ISO 8601 format (e.g., '2023-09-15T10:30:00Z')",
  }),
});

export const ProxyMetadataSchema = z.union([ProxyFileMetadataSchema, ProxyDirectoryMetadataSchema]).openapi("ProxyMetadata", {
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

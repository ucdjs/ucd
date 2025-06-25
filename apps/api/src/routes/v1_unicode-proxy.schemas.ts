import { z } from "@hono/zod-openapi";

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

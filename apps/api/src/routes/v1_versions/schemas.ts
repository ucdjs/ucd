import { z } from "@hono/zod-openapi";
import {
  UnicodeVersionSchema as _UnicodeVersionSchema,
  UnicodeVersionListSchema as _UnicodeVersionListSchema,
  UnicodeTreeNodeSchema as _UnicodeTreeNodeSchema,
  UnicodeTreeSchema as _UnicodeTreeSchema,
} from "@ucdjs/schemas";

// Re-export schemas with OpenAPI metadata
export const UnicodeVersionSchema = _UnicodeVersionSchema.openapi("UnicodeVersion", {
  description: "Represents a Unicode version with its metadata and support status.",
  examples: [
    {
      version: "17.0.0",
      documentationUrl: "https://www.unicode.org/versions/Unicode17.0.0/",
      date: null,
      url: "https://www.unicode.org/Public/17.0.0",
      mappedUcdVersion: null,
      type: "draft",
    },
    {
      version: "16.0.0",
      documentationUrl: "https://www.unicode.org/versions/Unicode16.0.0/",
      date: "2024",
      url: "https://www.unicode.org/Public/16.0.0",
      mappedUcdVersion: null,
      type: "stable",
    },
    {
      version: "15.1.0",
      documentationUrl: "https://www.unicode.org/versions/Unicode15.1.0/",
      date: "2023",
      url: "https://www.unicode.org/Public/15.1.0",
      mappedUcdVersion: null,
      type: "stable",
    },
  ],
});

export type UnicodeVersion = z.infer<typeof UnicodeVersionSchema>;

export const UnicodeVersionListSchema = _UnicodeVersionListSchema.openapi("UnicodeVersionList");

// For OpenAPI, we need to handle the recursive reference specially
const BaseTreeNodeSchema = z.object({
  name: z.string().openapi({
    description: "The name of the file or directory.",
  }),
  path: z.string().openapi({
    description: "The path to the file or directory.",
  }),
  lastModified: z.number().optional().openapi({
    description: "The last modified date of the directory, if available.",
  }),
});

const DirectoryTreeNodeSchema = BaseTreeNodeSchema.extend({
  type: z.literal("directory").openapi({
    description: "The type of the entry, which is a directory.",
  }),
  children: z.array(z.lazy(() => UnicodeTreeNodeSchema)).openapi({
    description: "The children of the directory.",
    type: "array",
    items: {
      $ref: "#/components/schemas/UnicodeTreeNode",
    },
  }),
});

const FileTreeNodeSchema = BaseTreeNodeSchema.extend({
  type: z.literal("file").openapi({
    description: "The type of the entry, which is a file.",
  }),
});

export const UnicodeTreeNodeSchema = z.union([DirectoryTreeNodeSchema, FileTreeNodeSchema]).openapi("UnicodeTreeNode");

export const UnicodeTreeSchema = _UnicodeTreeSchema.openapi("UnicodeTree");

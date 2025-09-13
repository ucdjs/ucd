import { z } from "@hono/zod-openapi";
import {
  UnicodeVersionSchema as _UnicodeVersionSchema,
} from "@ucdjs/schemas";

export const UnicodeVersionSchema = _UnicodeVersionSchema.openapi("UnicodeVersion");

export const UnicodeVersionListSchema = z.array(UnicodeVersionSchema).openapi("UnicodeVersionList");

type TreeNode = DirectoryTreeNode | FileTreeNode;

interface DirectoryTreeNode {
  type: "directory";
  name: string;
  path: string;
  children: TreeNode[];
  lastModified?: number; // Unix timestamp
}

interface FileTreeNode {
  type: "file";
  name: string;
  path: string;
  lastModified?: number; // Unix timestamp
}

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

const DirectoryTreeNodeSchema: z.ZodType<DirectoryTreeNode> = BaseTreeNodeSchema.extend({
  type: z.literal("directory").openapi({
    description: "The type of the entry, which is a directory.",
  }),

  // eslint-disable-next-line ts/no-use-before-define
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

export const UnicodeTreeSchema = z.array(UnicodeTreeNodeSchema).openapi("UnicodeTree");

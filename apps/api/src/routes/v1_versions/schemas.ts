import { z } from "@hono/zod-openapi";

export const UnicodeVersionSchema = z.object({
  version: z.string().openapi({
    description: "The version of the Unicode standard.",
  }),
  documentationUrl: z.url().openapi({
    description: "The URL to the Unicode version documentation.",
  }),
  date: z.string().regex(/^\d{4}$/, "Year must be a four-digit number").openapi({
    description: "The year of the Unicode version.",
  }).nullable(),
  url: z.url().openapi({
    description: "The URL to the Unicode Character Database (UCD) for this version.",
  }),
  mappedUcdVersion: z.string().nullable().openapi({
    description: "The corresponding UCD version mapping for this Unicode version. Null if same as version.",
  }),
  type: z.union([
    z.literal("stable"),
    z.literal("draft"),
    z.literal("unsupported"),
  ]).openapi({
    description: "The status of the Unicode version. 'unsupported' means the version exists but is not yet supported by the API.",
  }),
}).openapi("UnicodeVersion");

export type UnicodeVersion = z.infer<typeof UnicodeVersionSchema>;

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

export const UnicodeTreeSchema = z.array(UnicodeTreeNodeSchema).openapi("UnicodeTree", {
  examples: [
    {
      name: "UnicodeData.txt",
      type: "file",
      path: "/Public/15.1.0/ucd/UnicodeData.txt",
      size: 1889024,
      lastModified: 1693564800000,
    },
    {
      name: "emoji",
      type: "directory",
      path: "/Public/15.1.0/ucd/emoji/",
      lastModified: 1693564800000,
      children: [
        {
          name: "emoji-data.txt",
          type: "file",
          path: "/Public/15.1.0/ucd/emoji/emoji-data.txt",
          size: 156789,
        },
      ],
    },
  ],
});

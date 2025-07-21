import { z } from "@hono/zod-openapi";
import { UNICODE_TO_UCD_VERSION_MAPPINGS } from "@luxass/unicode-utils-new";

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

export const UnicodeVersionMappingsSchema = z.record(
  z.string(),
  z.string(),
).openapi("UnicodeVersionMappings", {
  description: "A mapping of Unicode versions to their corresponding Unicode Public Directory versions.",
  examples: [
    UNICODE_TO_UCD_VERSION_MAPPINGS,
  ],
});

export interface FileTreeNode {
  name: string;
  path: string;
  children?: FileTreeNode[];
}

export const FileTreeNodeSchema: z.ZodType<FileTreeNode> = z.object({
  name: z.string().openapi({
    description: "The name of the file or directory.",
  }),

  path: z.string().openapi({
    description: "The path to the file or directory.",
  }),

  children: z
    .array(z.lazy(() => FileTreeNodeSchema))
    .optional()
    .openapi({
      description: "The children of the directory, if it is a directory.",
      type: "array",
      items: {
        $ref: "#/components/schemas/FileTreeNode",
      },
    }),
}).openapi("FileTreeNode");

export const UnicodeFileTreeSchema = z.array(FileTreeNodeSchema).openapi("UnicodeFileTree", {
  examples: [
    {
      name: "UnicodeData.txt",
      type: "file",
      path: "/Public/15.1.0/ucd/UnicodeData.txt",
      size: 1889024,
    },
    {
      name: "emoji",
      type: "directory",
      path: "/Public/15.1.0/ucd/emoji/",
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

import { z } from "zod";

export const UnicodeVersionSchema = z.object({
  version: z.string().meta({
    description: "The version of the Unicode standard.",
  }),
  documentationUrl: z.url().meta({
    description: "The URL to the Unicode version documentation.",
  }),
  date: z.string().regex(/^\d{4}$/, "Year must be a four-digit number").meta({
    description: "The year of the Unicode version.",
  }).nullable(),
  url: z.url().meta({
    description: "The URL to the Unicode Character Database (UCD) for this version.",
  }),
  mappedUcdVersion: z.string().nullable().meta({
    description: "The corresponding UCD version mapping for this Unicode version. Null if same as version.",
  }),
  type: z.enum(["draft", "stable", "unsupported"]).meta({
    description: "The status of the Unicode version. 'unsupported' means the version exists but is not yet supported by the API.",
  }),
}).meta({
  id: "UnicodeVersion",
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

export type UnicodeVersion = z.output<typeof UnicodeVersionSchema>;

export const UnicodeVersionListSchema = z.array(UnicodeVersionSchema).meta({
  id: "UnicodeVersionList",
  description: "A list of Unicode versions with their metadata and support status.",
});

export type UnicodeVersionList = z.output<typeof UnicodeVersionListSchema>;

const BaseTreeNodeSchema = z.object({
  name: z.string().meta({
    description: "The name of the file or directory.",
  }),
  path: z.string().meta({
    description: "The path to the file or directory.",
  }),
  lastModified: z.number().optional().meta({
    description: "The last modified date of the directory, if available.",
  }),
});

export const UnicodeTreeNodeSchema = z
  .union([
    BaseTreeNodeSchema.extend({
      type: z.literal("directory").meta({
        description: "The type of the entry, which is a directory.",
      }),
      get children(): z.ZodArray<typeof UnicodeTreeNodeSchema> {
        return z.array(UnicodeTreeNodeSchema);
      },
    }),
    BaseTreeNodeSchema.extend({
      type: z.literal("file").meta({
        description: "The type of the entry, which is a file.",
      }),
    }),
  ])
  .meta({
    id: "UnicodeTreeNode",
    description: "Represents a file or directory node within a Unicode data tree.",
  });

export type UnicodeTreeNode = z.output<typeof UnicodeTreeNodeSchema>;

export const UnicodeTreeSchema = z.array(UnicodeTreeNodeSchema).meta({
  id: "UnicodeTree",
  description: "A tree structure representing files and directories in a Unicode version.",
});

export type UnicodeTree = z.output<typeof UnicodeTreeSchema>;

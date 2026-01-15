import type { DeepOmit } from "./types";
import { z } from "zod";
import { FileEntryDirectorySchema, FileEntryFileSchema } from "./fs";

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

// WE CAN'T USE RECURSIVE TYPES IN HONO ZOD OPENAPI, SO WE HAVE TO DEFINE THE INTERFACES MANUALLY
type TreeNode = DirectoryTreeNode | FileTreeNode;

interface BaseTreeNode {
  /**
   * The name of the file or directory.
   */
  name: string;

  /**
   * The path to the file or directory.
   *
   * If the node is a directory, it will always end with a trailing slash (`/`).
   */
  path: string;

  /**
   * The last modified date of the directory, if available.
   */
  lastModified: number | null; // Unix timestamp

}

interface DirectoryTreeNode extends BaseTreeNode {
  type: "directory";
  children: TreeNode[];
}

interface FileTreeNode extends BaseTreeNode {
  type: "file";
}

export const UnicodeVersionDetailsSchema = UnicodeVersionSchema.extend({
  statistics: z.object({
    totalCharacters: z.int().nonnegative().meta({
      description: "Total number of characters in this Unicode version.",
    }),
    newCharacters: z.int().nonnegative().meta({
      description: "Number of new characters added in this version.",
    }),
    totalBlocks: z.int().nonnegative().meta({
      description: "Total number of blocks in this Unicode version.",
    }),
    newBlocks: z.int().nonnegative().meta({
      description: "Number of new blocks added in this version.",
    }),
    totalScripts: z.int().nonnegative().meta({
      description: "Total number of scripts in this Unicode version.",
    }),
    newScripts: z.int().nonnegative().meta({
      description: "Number of new scripts added in this version.",
    }),
  }).default({
    newBlocks: 0,
    newCharacters: 0,
    newScripts: 0,
    totalBlocks: 0,
    totalCharacters: 0,
    totalScripts: 0,
  }).meta({
    description: "Statistics about this Unicode version. May be null if statistics are not available.",
  }),
}).meta({
  id: "UnicodeVersionDetails",
  description: "Detailed information about a Unicode version, including metadata and statistics.",
  examples: [
    {
      version: "16.0.0",
      documentationUrl: "https://www.unicode.org/versions/Unicode16.0.0/",
      date: "2024",
      url: "https://www.unicode.org/Public/16.0.0",
      mappedUcdVersion: null,
      type: "stable",
      statistics: {
        totalCharacters: 149813,
        newCharacters: 5185,
        totalBlocks: 331,
        newBlocks: 4,
        totalScripts: 165,
        newScripts: 2,
      },
    },
  ],
});

export type UnicodeVersionDetails = z.output<typeof UnicodeVersionDetailsSchema>;

const UnicodeFileTreeFileSchema = FileEntryFileSchema.meta({
  id: "UnicodeFileTreeFile",
  description: "A file node in the Unicode file tree.",
});

const UnicodeFileTreeDirectorySchema = FileEntryDirectorySchema.extend({
  // We need the type annotation to avoid typescript omitting the inferred type.
  get children(): z.ZodArray<typeof UnicodeFileTreeNodeSchema> {
    // eslint-disable-next-line ts/no-use-before-define
    return z.array(UnicodeFileTreeNodeSchema);
  },
}).meta({
  id: "UnicodeFileTreeDirectory",
  description: "A directory node in the Unicode file tree, containing child nodes.",
});

export const UnicodeFileTreeNodeSchema = z.union([
  UnicodeFileTreeDirectorySchema,
  UnicodeFileTreeFileSchema,
]).meta({
  id: "UnicodeFileTreeNode",
  description: "A recursive file tree node; directories include children, files do not.",
});

export type UnicodeFileTreeNode = z.infer<typeof UnicodeFileTreeNodeSchema>;

export type UnicodeFileTreeNodeWithoutLastModified = DeepOmit<UnicodeFileTreeNode, "lastModified">;

export const UnicodeFileTreeSchema = z.array(UnicodeFileTreeNodeSchema).meta({
  id: "UnicodeFileTree",
  description: "A recursive file tree structure rooted at an array of entries.",
});

export type UnicodeFileTree = z.infer<typeof UnicodeFileTreeSchema>;

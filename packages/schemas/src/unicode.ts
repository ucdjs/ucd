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

// WE CAN'T USE RECURSIVE TYPES IN HONO ZOD OPENAPI, SO WE HAVE TO DEFINE THE INTERFACES MANUALLY
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

const DirectoryTreeNodeSchema: z.ZodType<DirectoryTreeNode> = BaseTreeNodeSchema.extend({
  type: z.literal("directory").meta({
    description: "The type of the entry, which is a directory.",
  }),

  // eslint-disable-next-line ts/no-use-before-define
  children: z.array(z.lazy(() => UnicodeTreeNodeSchema)).meta({
    description: "The children of the directory.",
    type: "array",
    items: {
      $ref: "#/components/schemas/UnicodeTreeNode",
    },
  }),
});

const FileTreeNodeSchema = BaseTreeNodeSchema.extend({
  type: z.literal("file").meta({
    description: "The type of the entry, which is a file.",
  }),
});

export const UnicodeTreeNodeSchema = z.union([DirectoryTreeNodeSchema, FileTreeNodeSchema]).meta({
  id: "UnicodeTreeNode",
  description: "A node in the Unicode file tree.",
});

export type UnicodeTreeNode = z.output<typeof UnicodeTreeNodeSchema>;

export const UnicodeTreeSchema = z.array(UnicodeTreeNodeSchema).meta({
  id: "UnicodeTree",
  description: "A tree structure representing files and directories in a Unicode version.",
});

export type UnicodeTree = z.output<typeof UnicodeTreeSchema>;

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
  }).optional().meta({
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

export const UnicodeCharacterSchema = z.object({
  codepoint: z.string().regex(/^U\+[0-9A-F]{4,6}$/, "Must be in U+XXXX format").meta({
    description: "The Unicode codepoint in U+XXXX format.",
    example: "U+0041",
  }),
  character: z.string().meta({
    description: "The actual character.",
    example: "A",
  }),
  name: z.string().meta({
    description: "The official Unicode character name.",
    example: "LATIN CAPITAL LETTER A",
  }),
  category: z.string().meta({
    description: "The General Category of the character (e.g., Lu, Ll, Nd).",
    example: "Lu",
  }),
  combiningClass: z.string().optional().meta({
    description: "The Canonical Combining Class.",
  }),
  bidiCategory: z.string().optional().meta({
    description: "The Bidirectional Category.",
  }),
  decomposition: z.string().optional().meta({
    description: "The decomposition mapping.",
  }),
  numericValue: z.string().optional().meta({
    description: "The Numeric Value property (if applicable).",
  }),
  block: z.string().meta({
    description: "The Unicode block this character belongs to.",
    example: "Basic Latin",
  }),
  script: z.string().optional().meta({
    description: "The script this character belongs to (e.g., Latin, Greek).",
    example: "Latin",
  }),
  caseMapping: z.object({
    uppercase: z.string().optional().meta({
      description: "The uppercase mapping.",
    }),
    lowercase: z.string().optional().meta({
      description: "The lowercase mapping.",
    }),
    titlecase: z.string().optional().meta({
      description: "The titlecase mapping.",
    }),
  }).optional().meta({
    description: "Case mappings for this character.",
  }),
}).meta({
  id: "UnicodeCharacter",
  description: "Detailed information about a single Unicode character.",
});

export type UnicodeCharacter = z.output<typeof UnicodeCharacterSchema>;

export const UnicodePropertyResponseSchema = z.object({
  property: z.string().meta({
    description: "The Unicode property name.",
    example: "Alphabetic",
  }),
  value: z.string().optional().meta({
    description: "The property value filter (if any).",
  }),
  total: z.number().nonnegative().meta({
    description: "Total number of characters matching this property.",
  }),
  ranges: z.array(z.object({
    start: z.string().regex(/^U\+[0-9A-F]{4,6}$/).meta({
      description: "Start codepoint in U+XXXX format.",
    }),
    end: z.string().regex(/^U\+[0-9A-F]{4,6}$/).meta({
      description: "End codepoint in U+XXXX format.",
    }),
    count: z.number().nonnegative().meta({
      description: "Number of characters in this range.",
    }),
  })).optional().meta({
    description: "Character ranges matching this property (if format=ranges).",
  }),
  characters: z.array(z.object({
    codepoint: z.string().regex(/^U\+[0-9A-F]{4,6}$/),
    character: z.string(),
    name: z.string(),
  })).optional().meta({
    description: "List of characters (if format=list).",
  }),
}).meta({
  id: "UnicodePropertyResponse",
  description: "Characters matching a specific Unicode property.",
});

export type UnicodePropertyResponse = z.output<typeof UnicodePropertyResponseSchema>;

// Blocks endpoint schemas
export const UnicodeBlockSchema = z.object({
  name: z.string().meta({
    description: "The official Unicode block name.",
    example: "Basic Latin",
  }),
  aliases: z.array(z.string()).optional().meta({
    description: "Alternative names for this block.",
  }),
  range: z.object({
    start: z.string().regex(/^U\+[0-9A-F]{4,6}$/).meta({
      description: "Start codepoint in U+XXXX format.",
    }),
    end: z.string().regex(/^U\+[0-9A-F]{4,6}$/).meta({
      description: "End codepoint in U+XXXX format.",
    }),
  }).meta({
    description: "The codepoint range of this block.",
  }),
  count: z.number().nonnegative().meta({
    description: "Number of assigned characters in this block.",
  }),
  description: z.string().optional().meta({
    description: "A description of the block.",
  }),
  relatedScripts: z.array(z.string()).optional().meta({
    description: "Scripts associated with characters in this block.",
  }),
  characters: z.array(z.object({
    codepoint: z.string().regex(/^U\+[0-9A-F]{4,6}$/),
    character: z.string(),
    name: z.string(),
  })).optional().meta({
    description: "Characters in this block (if include_characters=true).",
  }),
}).meta({
  id: "UnicodeBlock",
  description: "Information about a Unicode block.",
});

export type UnicodeBlock = z.output<typeof UnicodeBlockSchema>;

export const UnicodeBlockListSchema = z.array(UnicodeBlockSchema).meta({
  id: "UnicodeBlockList",
  description: "A list of Unicode blocks.",
});

export type UnicodeBlockList = z.output<typeof UnicodeBlockListSchema>;

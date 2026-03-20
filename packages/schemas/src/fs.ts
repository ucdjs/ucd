import { dedent } from "@luxass/utils";
import { z } from "zod";

export const UCDStoreManifestSchema = z.record(
  z.string(),
  z.object({
    /**
     * List of expected file paths for this version.
     * Defaults to an empty array when not provided.
     */
    expectedFiles: z.array(z.string()).default([]),
  }).default({
    expectedFiles: [],
  }),
).meta({
  id: "UCDStoreManifest",
  description: dedent`
    A record of per-version metadata for the UCD store.
    Each key is the version string, and the value is an object holding metadata.

    Fields:
    - expectedFiles: string[] (defaults to [])

    ## Example
    \`\`\`json
    {
      "15.1.0": { "expectedFiles": ["UnicodeData.txt", "PropList.txt"] },
      "14.0.0": { "expectedFiles": [] }
    }
    \`\`\`

    The path is relative to the root of the UCD Api Server, typically \`https://api.ucdjs.dev/api/v1/files\`. E.g. \`15.1.0\` would resolve to \`https://api.ucdjs.dev/api/v1/files/15.1.0\`.
  `,
});

export type UCDStoreManifest = z.output<typeof UCDStoreManifestSchema>;

const FileEntryBaseSchema = z.object({
  name: z.string(),
  path: z.string(),
  lastModified: z.number().or(z.null()),
});

export const FileEntryDirectorySchema = FileEntryBaseSchema.extend({
  type: z.literal("directory"),
});

export const FileEntryFileSchema = FileEntryBaseSchema.extend({
  type: z.literal("file"),
});

export const FileEntrySchema = z.union([
  FileEntryDirectorySchema,
  FileEntryFileSchema,
]).meta({
  id: "FileEntry",
  description: dedent`
    Response schema for a file entry in the UCD store.

    This schema represents either a directory listing or a file response.
  `,
}).superRefine((data, ctx) => {
  // Ensure that directory paths end with a slash
  if (data.type === "directory" && !data.path.endsWith("/")) {
    ctx.addIssue({
      code: "custom",
      message: "Directory paths must end with a trailing slash ('/').",
    });
  }

  // If the path doesn't start with a slash.
  if (!data.path.startsWith("/")) {
    ctx.addIssue({
      code: "custom",
      message: "Paths must start with a leading slash ('/').",
    });
  }
});

export type FileEntry = z.infer<typeof FileEntrySchema>;

export const BackendFileEntrySchema = FileEntryFileSchema.omit({
  lastModified: true,
}).meta({
  id: "BackendFileEntry",
  description: "A file entry used by filesystem backends.",
});

export const BackendDirectoryEntrySchema = FileEntryDirectorySchema.omit({
  lastModified: true,
}).extend({
  get children(): z.ZodDefault<z.ZodArray<typeof BackendEntrySchema>> {
    // eslint-disable-next-line ts/no-use-before-define
    return z.array(BackendEntrySchema).default([]);
  },
}).meta({
  id: "BackendDirectoryEntry",
  description: "A directory entry used by filesystem backends.",
});

export const BackendEntrySchema = z.union([
  BackendDirectoryEntrySchema,
  BackendFileEntrySchema,
]).meta({
  id: "BackendEntry",
  description: dedent`
    Recursive backend entry schema used by filesystem backends.

    Filesystem backends use a tree-based entry shape where directories contain
    child entries and lastModified is not required.
  `,
}).superRefine((data, ctx) => {
  if (data.type === "directory" && !data.path.endsWith("/")) {
    ctx.addIssue({
      code: "custom",
      message: "Directory paths must end with a trailing slash ('/').",
    });
  }

  if (!data.path.startsWith("/")) {
    ctx.addIssue({
      code: "custom",
      message: "Paths must start with a leading slash ('/').",
    });
  }
});

export type BackendEntry = z.infer<typeof BackendEntrySchema>;

export const FileEntryListSchema = z.array(FileEntrySchema).meta({
  id: "FileEntryList",
  description: "An array of file entries, each representing either a file or a directory.",
});

export type FileEntryList = z.infer<typeof FileEntryListSchema>;

export const BackendEntryListSchema = z.array(BackendEntrySchema).meta({
  id: "BackendEntryList",
  description: "An array of recursive backend entries.",
});

export type BackendEntryList = z.infer<typeof BackendEntryListSchema>;

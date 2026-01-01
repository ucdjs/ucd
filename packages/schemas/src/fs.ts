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

const BaseItemSchema = z.object({
  name: z.string(),
  path: z.string(),
  lastModified: z.number(),
});

const DirectoryResponseSchema = BaseItemSchema.extend({
  type: z.literal("directory"),
});

const FileResponseSchema = BaseItemSchema.extend({
  type: z.literal("file"),
});

export const FileEntrySchema = z.union([
  DirectoryResponseSchema,
  FileResponseSchema,
]).meta({
  description: dedent`
    Response schema for a file entry in the UCD store.

    This schema represents either a directory listing or a file response.
  `,
});

export type FileEntry = z.infer<typeof FileEntrySchema>;

export const FileEntryListSchema = z.array(FileEntrySchema).meta({
  id: "FileEntryList",
  description: "An array of file entries, each representing either a file or a directory.",
});

export type FileEntryList = z.infer<typeof FileEntryListSchema>;

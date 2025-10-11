import { dedent } from "@luxass/utils";
import { z } from "zod";
import { ucdRegistry } from "./zod-registry";

export const UCDStoreManifestSchema = z.record(
  z.string(),
  z.string(),
).register(ucdRegistry, {
  id: "UCDStoreManifest",
  description: dedent`
    A record of key-value pairs representing the UCD store.
    Each key is a string representing the version, and each value is the path where the version's files are stored.

    ## Example
    \`\`\`json
    {
      "15.1.0": "15.1.0",
      "14.0.0": "14.0.0",
      "13.0.0": "13.0.0"
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
]).register(ucdRegistry, {
  description: dedent`
    Response schema for a file entry in the UCD store.

    This schema represents either a directory listing or a file response.
  `,
});

export type FileEntry = z.infer<typeof FileEntrySchema>;

export const FileEntryListSchema = z.array(FileEntrySchema).register(ucdRegistry, {
  id: "FileEntryList",
  description: "An array of file entries, each representing either a file or a directory.",
});

export type FileEntryList = z.infer<typeof FileEntryListSchema>;

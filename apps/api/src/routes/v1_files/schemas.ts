import { z } from "@hono/zod-openapi";
import { dedent } from "@luxass/utils/string";
import { FileEntrySchema as _FileEntrySchema } from "@ucdjs/schemas";

export const UCDStoreSchema = z.record(
  z.string(),
  z.string(),
).openapi("UCDStore", {
  description: dedent`
    A record of key-value pairs representing the UCD store.
    Each key is a string representing the version, and each value is the path where the version's files are stored.

    ## Example
    \`\`\`json
    {
      "15.1.0": "/15.1.0",
      "14.0.0": "/14.0.0",
      "13.0.0": "/13.0.0"
    }
    \`\`\`

    The path is relative to the root of the UCD Api Server, typically \`https://api.ucdjs.dev/api/v1/files\`. E.g. \`/15.1.0\` would resolve to \`https://api.ucdjs.dev/api/v1/files/15.1.0\`.
  `,
});

export type UCDStore = z.output<typeof UCDStoreSchema>;

export const FileEntrySchema = _FileEntrySchema.openapi("FileEntry");

import { dedent } from "@luxass/utils";
import { z } from "zod";

export const UCDStoreVersionManifestSchema = z.object({
  expectedFiles: z.array(z.string()).meta({
    description: "List of expected file paths for this version",
  }),
}).meta({
  id: "UCDStoreVersionManifest",
  description: dedent`
    Response schema for per-version manifest endpoint.
    Matches the schema from /.well-known/ucd-store/{version}.json
  `,
});

export type UCDStoreVersionManifest = z.infer<typeof UCDStoreVersionManifestSchema>;

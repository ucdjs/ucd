import { dedent } from "@luxass/utils";
import { z } from "zod";

/**
 * Schema for a single expected file in the manifest.
 * Provides multiple path formats for different use cases.
 */
export const ExpectedFileSchema = z.object({
  /**
   * Filename only (e.g., "ArabicShaping.txt", "DerivedBidiClass.txt")
   */
  name: z.string().meta({
    description: "Filename only",
  }),
  /**
   * Path relative to /api/v1/files endpoint.
   * Includes /ucd/ prefix for versions >= 4.1.0.
   * Example: "/16.0.0/ucd/ArabicShaping.txt" or "/4.0.0/UnicodeData.txt"
   */
  path: z.string().meta({
    description: "Path relative to /api/v1/files endpoint (includes /ucd/ for versions >= 4.1.0)",
  }),
  /**
   * Path for the store subdomain (ucd-store.ucdjs.dev).
   * Does not include /ucd/ prefix as the store handles it internally.
   * Example: "/16.0.0/ArabicShaping.txt"
   */
  storePath: z.string().meta({
    description: "Path for store subdomain (without /ucd/ prefix)",
  }),
}).meta({
  id: "ExpectedFile",
  description: "A file expected to be present in a UCD version",
});

export type ExpectedFile = z.infer<typeof ExpectedFileSchema>;

export const UCDStoreVersionManifestSchema = z.object({
  expectedFiles: z.array(ExpectedFileSchema).meta({
    description: "List of expected files for this version with their paths",
  }),
}).meta({
  id: "UCDStoreVersionManifest",
  description: dedent`
    Response schema for per-version manifest endpoint.
    Matches the schema from /.well-known/ucd-store/{version}.json
  `,
});

export type UCDStoreVersionManifest = z.infer<typeof UCDStoreVersionManifestSchema>;

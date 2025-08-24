import { dedent } from "@luxass/utils";
import { z } from "zod";

export const UnicodeVersionSchema = z.object({
  version: z.string().describe("The version of the Unicode standard."),
  documentationUrl: z.url().describe("The URL to the Unicode version documentation."),
  date: z.string().regex(/^\d{4}$/, "Year must be a four-digit number").describe("The year of the Unicode version.").nullable(),
  url: z.url().describe("The URL to the Unicode Character Database (UCD) for this version."),
  mappedUcdVersion: z.string().nullable().describe("The corresponding UCD version mapping for this Unicode version. Null if same as version."),
  type: z.enum(["draft", "stable", "unsupported"]).describe("The status of the Unicode version. 'unsupported' means the version exists but is not yet supported by the API."),
}).meta({
  description: dedent`
    Represents a Unicode version with its metadata and support status.
    
    This schema defines the structure for Unicode version information including
    version number, documentation URLs, release dates, and support status.
  `,
});

export type UnicodeVersion = z.infer<typeof UnicodeVersionSchema>;

export const UnicodeVersionListSchema = z.array(UnicodeVersionSchema).meta({
  description: "A list of Unicode versions.",
});

export type UnicodeVersionList = z.infer<typeof UnicodeVersionListSchema>;
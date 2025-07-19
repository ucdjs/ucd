import { z } from "@hono/zod-openapi";

export const UnicodeVersionSchema = z.object({
  version: z.string().openapi({
    description: "The version of the Unicode standard.",
  }),
  documentationUrl: z.url().openapi({
    description: "The URL to the Unicode version documentation.",
  }),
  date: z.string().regex(/^\d{4}$/, "Year must be a four-digit number").openapi({
    description: "The year of the Unicode version.",
  }).nullable(),
  url: z.url().openapi({
    description: "The URL to the Unicode Character Database (UCD) for this version.",
  }),
  mappedUcdVersion: z.string().nullable().openapi({
    description: "The corresponding UCD version mapping for this Unicode version. Null if same as version.",
  }),
  status: z.union([
    z.literal("stable"),
    z.literal("draft"),
    z.literal("unsupported"),
  ]).openapi({
    description: "The status of the Unicode version. 'unsupported' means the version exists but is not yet supported by the API.",
  }),
}).openapi("UnicodeVersion");

export type UnicodeVersion = z.infer<typeof UnicodeVersionSchema>;

export const UnicodeVersionMappingsSchema = z.record(
  z.string(),
  z.string(),
).openapi("UnicodeVersionMappings");

export const UnicodeVersionMetadataSchema = z.record(
  z.string(),
  z.any(),
).openapi("UnicodeVersionMetadata");

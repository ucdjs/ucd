import { z } from "@hono/zod-openapi";
import {
  UCDStoreManifestSchema as _UCDStoreManifestSchema,
  FileEntrySchema,
} from "@ucdjs/schemas";

export const UCDStoreManifestSchema = _UCDStoreManifestSchema.openapi("UCDStoreManifest");
export const FileEntryListSchema = z.array(FileEntrySchema).openapi("FileEntryList");

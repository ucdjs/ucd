import { z } from "@hono/zod-openapi";
import {
  UCDStoreManifestSchema as _UCDStoreManifestSchema,
  FileEntryListSchema as _FileEntryListSchema,
} from "@ucdjs/schemas";

export const UCDStoreManifestSchema = _UCDStoreManifestSchema.openapi("UCDStoreManifest");
export const FileEntryListSchema = _FileEntryListSchema.openapi("FileEntryList");

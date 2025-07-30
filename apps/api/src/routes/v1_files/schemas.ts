import {
  FileEntrySchema as _FileEntrySchema,
  UCDStoreManifestSchema as _UCDStoreManifestSchema,
} from "@ucdjs/schemas";

export const UCDStoreManifestSchema = _UCDStoreManifestSchema.openapi("UCDStoreManifest");
export const FileEntrySchema = _FileEntrySchema.openapi("FileEntry");

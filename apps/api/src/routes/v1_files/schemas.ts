import { z } from "@hono/zod-openapi";
import { dedent } from "@luxass/utils/string";
import { FileEntrySchema as _FileEntrySchema, UCDStoreSchema as _UCDStoreSchema } from "@ucdjs/schemas";

export const UCDStoreSchema = _UCDStoreSchema.openapi("UCDStore");
export const FileEntrySchema = _FileEntrySchema.openapi("FileEntry");

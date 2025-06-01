import { safeJsonParse } from "@ucdjs/utils";
import { z } from "zod/v4";

export const UCD_STORE_ROOT_SCHEMA = z.object({
  root: z.boolean(),
  versions: z.array(
    z.object({
      version: z.string(),
      path: z.string(),
    }),
  ),
});

export const UCD_STORE_VERSION_SCHEMA = z.object({
  version: z.string(),
  files: z.array(z.string()),
});

export type UCDStoreRootSchema = z.infer<typeof UCD_STORE_ROOT_SCHEMA>;
export type UCDStoreVersionSchema = z.infer<typeof UCD_STORE_VERSION_SCHEMA>;

export async function validateUCDRootStore(
  content: string,
): Promise<UCDStoreRootSchema> {
  const parsed = UCD_STORE_ROOT_SCHEMA.safeParse(safeJsonParse(content));
  if (!parsed.success) {
    throw new Error(
      `[ucd-store]: Invalid UCD store root schema: ${parsed.error.message}`,
    );
  }

  return parsed.data;
}

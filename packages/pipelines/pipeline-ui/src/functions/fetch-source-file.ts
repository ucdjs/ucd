import { SourceFileResponseSchema, type SourceFileResponse } from "../schemas/source";
import { fetchWithParse } from "./fetch-with-parse";

export async function fetchSourceFile(
  baseUrl: string,
  sourceId: string,
  fileId: string,
): Promise<SourceFileResponse> {
  return fetchWithParse(
    `${baseUrl}/api/sources/${sourceId}/${fileId}`,
    SourceFileResponseSchema,
  );
}

import { SourceDetailResponseSchema, type SourceDetailResponse } from "../schemas/source";
import { fetchWithParse } from "./fetch-with-parse";

export async function fetchSource(
  baseUrl: string,
  sourceId: string,
): Promise<SourceDetailResponse> {
  return fetchWithParse(
    `${baseUrl}/api/sources/${sourceId}`,
    SourceDetailResponseSchema,
  );
}

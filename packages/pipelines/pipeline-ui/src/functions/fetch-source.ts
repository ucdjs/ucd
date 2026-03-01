import { SourceDetailSchema, type SourceDetail } from "../schemas/source";
import { fetchWithParse } from "./fetch-with-parse";

export async function fetchSource(
  baseUrl: string,
  sourceId: string,
): Promise<SourceDetail> {
  return fetchWithParse(
    `${baseUrl}/api/sources/${sourceId}`,
    SourceDetailSchema,
  );
}

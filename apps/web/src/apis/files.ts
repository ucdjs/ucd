import type { FileEntry } from "@ucdjs/schemas";
import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";

const UCD_FILE_STAT_TYPE_HEADER = "UCD-File-Stat-Type";

export type FilesResponse
  = | { type: "directory"; files: FileEntry[] }
    | { type: "file"; content: string; contentType: string };

export const fetchFiles = createServerFn({ method: "GET" })
  .inputValidator((data: { path: string }) => data)
  .handler(async ({ data }): Promise<FilesResponse> => {
    const baseFilesUrl = `${import.meta.env.VITE_UCDJS_API_BASE_URL}/api/v1/files`;
    const url = data.path ? `${baseFilesUrl}/${data.path}` : baseFilesUrl;

    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`Failed to fetch files: ${res.statusText}`);
    }

    const fileStatType = res.headers.get(UCD_FILE_STAT_TYPE_HEADER);

    if (fileStatType === "file") {
      const content = await res.text();
      const contentType = res.headers.get("Content-Type") || "text/plain";
      return { type: "file", content, contentType };
    }

    // Default to directory listing (JSON response)
    const files = (await res.json()) as FileEntry[];
    return { type: "directory", files };
  });

export function filesQueryOptions(path: string = "") {
  return queryOptions({
    queryKey: ["files", path],
    queryFn: () => fetchFiles({ data: { path } }),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

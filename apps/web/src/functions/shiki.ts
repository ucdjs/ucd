import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

export const fetchShikiHtml = createServerFn({ method: "GET" })
  .inputValidator((data: { path: string }) => data)
  .handler(async ({ data }) => {
    const request = getRequest();
    const signal = request.signal;
    const url = new URL(`/api/shiki/${data.path}`, request.url);
    const res = await fetch(url, { signal });

    if (!res.ok) {
      throw new Error(`Failed to fetch highlighted content: ${res.statusText}`);
    }

    return res.text();
  });

export function shikiHtmlQueryOptions(path: string) {
  return queryOptions({
    queryKey: ["shiki-html", path],
    queryFn: () => fetchShikiHtml({ data: { path } }),
    staleTime: 1000 * 60 * 60, // 1 hour
    enabled: Boolean(path),
  });
}

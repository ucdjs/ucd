import { getHighlightedFile, HighlightFileError } from "#server/file-highlight";
import { createFileRoute } from "@tanstack/react-router";

const CACHE_HEADER_VALUE = "public, max-age=3600, s-maxage=604800";

export const Route = createFileRoute("/api/file/$")({
  staticData: {
    isApi: true,
  },
  server: {
    handlers: {
      GET: async ({ params, context, request }) => {
        const path = params._splat ? decodeURIComponent(params._splat) : "";

        if (!path) {
          return new Response("Missing file path", { status: 400 });
        }

        try {
          const result = await getHighlightedFile({
            path,
            apiBaseUrl: context.apiBaseUrl,
            signal: request.signal,
          });

          return new Response(JSON.stringify(result), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": CACHE_HEADER_VALUE,
            },
          });
        } catch (error) {
          if (error instanceof HighlightFileError) {
            return new Response(error.message, { status: error.status });
          }

          return new Response("Failed to fetch file", { status: 502 });
        }
      },
    },
  },
});

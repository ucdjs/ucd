import type { UCDClient } from "@ucdjs/client";
import handler, { createServerEntry } from "@tanstack/react-start/server-entry";
import { createUCDClient } from "@ucdjs/client";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";

interface ServerRequestContext {
  apiBaseUrl: string;
  client: UCDClient;
}

declare module "@tanstack/react-start" {
  interface Register {
    server: {
      requestContext: ServerRequestContext;
    };
  }
}

export default createServerEntry({
  async fetch(request) {
    const response = await handler.fetch(request, {
      context: {
        apiBaseUrl: UCDJS_API_BASE_URL,
        client: await createUCDClient(UCDJS_API_BASE_URL),
      },
    });

    const pathname = new URL(request.url).pathname;

    if (pathname === "/file-explorer" || pathname.startsWith("/file-explorer/")) {
      const headers = new Headers(response.headers);
      headers.set("X-Robots-Tag", "noindex, nofollow");
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    }

    return response;
  },
});

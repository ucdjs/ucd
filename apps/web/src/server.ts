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
    return handler.fetch(request, {
      context: {
        apiBaseUrl: UCDJS_API_BASE_URL,
        client: await createUCDClient(UCDJS_API_BASE_URL),
      },
    });
  },
});

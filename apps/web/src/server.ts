import handler, { createServerEntry } from "@tanstack/react-start/server-entry";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";

interface ServerRequestContext {
  apiBaseUrl: string;
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
      },
    });
  },
});

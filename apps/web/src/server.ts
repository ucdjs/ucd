import handler, { createServerEntry } from "@tanstack/react-start/server-entry";

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
        // eslint-disable-next-line node/prefer-global/process
        apiBaseUrl: process.env.UCDJS_API_BASE_URL || "https://api.ucdjs.dev",
      },
    });
  },
});

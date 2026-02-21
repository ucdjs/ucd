import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { UNICODE_STABLE_VERSION } from "@unicode-utils/core";
import { z } from "zod";
import { routeTree } from "./routeTree.gen";

const originalAdd = z.globalRegistry.add;

// terrible hack for vite's HMR:
// without this monkey-patch, zod will throw an error whenever editing a schema file that uses
// `.register` as it would try to re-register the schema with the same ID again
// with this patch, re-registering will just replace the schema in the registry
// https://github.com/colinhacks/zod/issues/4145
z.globalRegistry.add = (
  schema: Parameters<typeof originalAdd>[0],
  meta: Parameters<typeof originalAdd>[1],
) => {
  if (!meta.id) {
    return originalAdd.call(z.globalRegistry, schema, meta);
  }

  const existingSchema = z.globalRegistry._idmap.get(meta.id);
  if (existingSchema) {
    z.globalRegistry.remove(existingSchema);
    z.globalRegistry._idmap.delete(meta.id);
  }
  return originalAdd.call(z.globalRegistry, schema, meta);
};

export function getRouter() {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: {
      queryClient,
      latestUnicodeVersion: UNICODE_STABLE_VERSION,
      apiBaseUrl: UCDJS_API_BASE_URL || "https://api.ucdjs.dev",
    },
    defaultPreload: "intent",
    Wrap: (props: { children: React.ReactNode }) => {
      return (
        <QueryClientProvider client={queryClient}>
          {props.children}
        </QueryClientProvider>
      );
    },
  });

  setupRouterSsrQueryIntegration({ router, queryClient });

  return router;
}

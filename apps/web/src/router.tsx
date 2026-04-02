import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { UCDJS_API_BASE_URL, UCDJS_DOCS_URL } from "@ucdjs/env";
import { UNICODE_STABLE_VERSION } from "@unicode-utils/core";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 60, // 1 hour
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: {
      queryClient,
      latestUnicodeVersion: UNICODE_STABLE_VERSION,
      apiBaseUrl: UCDJS_API_BASE_URL,
      docsUrl: UCDJS_DOCS_URL,
    },
    defaultPreload: "intent",
    // eslint-disable-next-line react/component-hook-factories
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

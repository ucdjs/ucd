import type { RouterHistory } from "@tanstack/react-router";
import { HotkeysProvider } from "@tanstack/react-hotkeys";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export function createAppQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: 15 * 60 * 1000,
        retry(failureCount, error) {
          if (error instanceof Error && "status" in error && error.status === 404) {
            return false;
          }

          return failureCount < 2;
        },
      },
    },
  });
}

export function createAppRouter({
  history,
  queryClient = createAppQueryClient(),
}: {
  history?: RouterHistory;
  queryClient?: QueryClient;
} = {}) {
  return createRouter({
    history,
    routeTree,
    context: {
      queryClient,
    },
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
    // eslint-disable-next-line react/component-hook-factories
    Wrap(props) {
      return (
        <HotkeysProvider>
          <QueryClientProvider client={queryClient}>
            {props.children}
          </QueryClientProvider>
        </HotkeysProvider>
      );
    },
  });
}

export type AppRouter = ReturnType<typeof createAppRouter>;

declare module "@tanstack/react-router" {
  interface Register {
    router: AppRouter;
  }
}

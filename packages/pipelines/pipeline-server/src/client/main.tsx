import { injectThemeScript } from "#lib/theme";
import { HotkeysProvider } from "@tanstack/react-hotkeys";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { createRoot } from "react-dom/client";
import { routeTree } from "./routeTree.gen";
import "./index.css";

injectThemeScript();
const queryClient = new QueryClient({
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

const router = createRouter({
  routeTree,
  context: {
    queryClient,
  },
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
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

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("app")!;

if (!rootElement.innerHTML) {
  const root = createRoot(rootElement);
  root.render(<RouterProvider router={router} />);
}

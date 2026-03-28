/* eslint-disable react/component-hook-factories */
import type { RenderOptions } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
import { createMemoryHistory, RouterContextProvider, RouterProvider } from "@tanstack/react-router";
import { act, render } from "@testing-library/react";
import { createAppQueryClient, createAppRouter } from "../../src/client/app-router";

interface RenderFileRouteOptions extends Omit<RenderOptions, "wrapper"> {
  initialLocation?: string;
  queryClient?: QueryClient;
}

export async function renderFileRoute(
  ui: React.ReactElement,
  {
    initialLocation = "/",
    queryClient: providedQueryClient,
    ...renderOptions
  }: RenderFileRouteOptions = {},
) {
  const history = createMemoryHistory({
    initialEntries: [initialLocation],
  });

  const queryClient = providedQueryClient ?? createAppQueryClient();
  const router = createAppRouter({
    history,
    queryClient,
  });

  function Wrapper({ children }: { children: React.ReactNode }) {
    // @ts-expect-error - the router provider types don't allow for the full flexibility of our router options, but in practice this works fine
    return <RouterProvider router={router}>{children}</RouterProvider>;
  }

  let rendered!: ReturnType<typeof render>;

  await act(async () => {
    rendered = render(ui, { wrapper: Wrapper, ...renderOptions });
    await router.load();
  });

  return {
    ...rendered,
    history,
    queryClient,
    router,
  };
}

/**
 * Renders a component with a real TanStack Router context (no route outlets).
 * Use this for component tests that rely on `Link`, `useNavigate`, or `useParams`
 * without needing to render the full route tree. API calls can be intercepted via
 * `mockFetch` as usual.
 *
 * `initialLocation` controls which route the router is matched against, so
 * `useParams()` returns params derived from that path.
 */
export async function renderComponent(
  ui: React.ReactElement,
  {
    initialLocation = "/",
    queryClient: providedQueryClient,
    ...renderOptions
  }: RenderFileRouteOptions = {},
) {
  const history = createMemoryHistory({ initialEntries: [initialLocation] });
  // Use retry: false so unfulfilled loader requests fail fast without retries.
  const queryClient = providedQueryClient ?? new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const router = createAppRouter({ history, queryClient });

  let rendered!: ReturnType<typeof render>;

  await act(async () => {
    rendered = render(
      <RouterContextProvider router={router}>
        {ui}
      </RouterContextProvider>,
      renderOptions,
    );
    // Load the router so that route matches (and thus useParams) are populated.
    // Errors from unfulfilled loaders are silently ignored since we only need
    // the routing context, not the route's loaded data.
    await router.load().catch(() => {});
  });

  return { ...rendered, history, queryClient, router };
}

import type { QueryClient } from "@tanstack/react-query";
import type { RenderOptions } from "@testing-library/react";
import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
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

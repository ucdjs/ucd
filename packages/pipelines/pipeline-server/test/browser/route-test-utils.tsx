import type { QueryClient } from "@tanstack/react-query";
import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { act, render } from "@testing-library/react";
import { createAppQueryClient, createAppRouter } from "../../src/client/app-router";

export async function renderFileRoute(
  initialPath: string,
  options: { queryClient?: QueryClient } = {},
) {
  const history = createMemoryHistory({
    initialEntries: [initialPath],
  });

  const queryClient = options.queryClient ?? createAppQueryClient();
  const router = createAppRouter({
    history,
    queryClient,
  });

  let rendered!: ReturnType<typeof render>;

  await act(async () => {
    rendered = render(<RouterProvider router={router} />);
    await router.load();
  });

  return {
    ...rendered,
    history,
    queryClient,
    router,
  };
}

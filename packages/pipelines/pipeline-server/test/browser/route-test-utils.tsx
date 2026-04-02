/* eslint-disable react/component-hook-factories */
import type { RenderOptions } from "@testing-library/react";
import { getHotkeyManager } from "@tanstack/react-hotkeys";
import { QueryClient } from "@tanstack/react-query";
import { createMemoryHistory, RouterContextProvider, RouterProvider } from "@tanstack/react-router";
import { act, fireEvent, render } from "@testing-library/react";
import { createAppRouter } from "../../src/client/app-router";

const REAL_COMMAND_PALETTE_FLAG = "__useRealPipelineCommandPalette__";

interface RenderFileRouteOptions extends Omit<RenderOptions, "wrapper"> {
  initialLocation?: string;
  queryClient?: QueryClient;
  localStorage?: Record<string, string>;
  useRealCommandPalette?: boolean;
}

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

export function clearTestLocalStorage() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.clear();
}

export function seedTestLocalStorage(entries: Record<string, string>) {
  clearTestLocalStorage();

  for (const [key, value] of Object.entries(entries)) {
    localStorage.setItem(key, value);
  }
}

export function setRealPipelineCommandPaletteEnabled(enabled: boolean) {
  (globalThis as { [REAL_COMMAND_PALETTE_FLAG]?: boolean })[REAL_COMMAND_PALETTE_FLAG] = enabled;
}

export function getTestHotkeyManager() {
  return getHotkeyManager();
}

export function dispatchHotkey(key: string, options: {
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  target?: Document | HTMLElement;
} = {}) {
  const {
    ctrlKey = false,
    metaKey = false,
    altKey = false,
    shiftKey = false,
    target = document,
  } = options;

  fireEvent.keyDown(target, {
    key,
    code: key.length === 1 ? `Key${key.toUpperCase()}` : key,
    ctrlKey,
    metaKey,
    altKey,
    shiftKey,
  });
}

export function dispatchModHotkey(key: string, target?: Document | HTMLElement) {
  dispatchHotkey(key, {
    ctrlKey: true,
    target,
  });
}

export async function renderFileRoute(
  ui: React.ReactElement,
  {
    initialLocation = "/",
    queryClient: providedQueryClient,
    localStorage: localStorageEntries,
    useRealCommandPalette = false,
    ...renderOptions
  }: RenderFileRouteOptions = {},
) {
  if (localStorageEntries) {
    seedTestLocalStorage(localStorageEntries);
  }

  setRealPipelineCommandPaletteEnabled(useRealCommandPalette);

  const history = createMemoryHistory({
    initialEntries: [initialLocation],
  });

  const queryClient = providedQueryClient ?? createTestQueryClient();
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
    localStorage: localStorageEntries,
    useRealCommandPalette = false,
    ...renderOptions
  }: RenderFileRouteOptions = {},
) {
  if (localStorageEntries) {
    seedTestLocalStorage(localStorageEntries);
  }

  setRealPipelineCommandPaletteEnabled(useRealCommandPalette);

  const history = createMemoryHistory({ initialEntries: [initialLocation] });
  const queryClient = providedQueryClient ?? createTestQueryClient();
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

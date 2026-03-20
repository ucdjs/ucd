import { cleanup, renderHook as rtlRenderHook } from "@testing-library/react";
import { act as reactAct } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

const roots = new Map<Element, ReturnType<typeof createRoot>>();

vi.mock("react-dom/test-utils", () => {
  return {
    act: reactAct,
  };
});

vi.mock("@testing-library/react-hooks", () => {
  return {
    renderHook: rtlRenderHook,
    act: reactAct,
    cleanup: async () => cleanup(),
    addCleanup: () => () => {},
    removeCleanup: () => {},
    suppressErrorOutput: () => () => {},
  };
});

vi.mock("react-dom", async () => {
  const actual = await vi.importActual<typeof import("react-dom")>("react-dom");

  return {
    ...actual,
    render(element: Parameters<ReturnType<typeof createRoot>["render"]>[0], container: Element) {
      let root = roots.get(container);

      if (!root) {
        root = createRoot(container);
        roots.set(container, root);
      }

      root.render(element);
      return root;
    },
    unmountComponentAtNode(container: Element) {
      const root = roots.get(container);
      if (!root) {
        return false;
      }

      root.unmount();
      roots.delete(container);
      return true;
    },
  };
});

vi.mock("#components/app/pipeline-command-palette", () => {
  if ((globalThis as { __useRealPipelineCommandPalette__?: boolean }).__useRealPipelineCommandPalette__) {
    return vi.importActual<typeof import("#components/app/pipeline-command-palette")>("#components/app/pipeline-command-palette");
  }

  return {
    PipelineCommandPalette: () => null,
  };
});

vi.mock("@tanstack/react-devtools", () => {
  return {
    TanStackDevtools: () => null,
  };
});

vi.mock("@tanstack/react-query-devtools", () => {
  return {
    ReactQueryDevtoolsPanel: () => null,
  };
});

vi.mock("@tanstack/react-hotkeys-devtools", () => {
  return {
    HotkeysDevtoolsPanel: () => null,
  };
});

vi.mock("@tanstack/react-router-devtools", () => {
  return {
    TanStackRouterDevtoolsPanel: () => null,
  };
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

if (typeof window !== "undefined" && typeof window.matchMedia !== "function") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent() {
        return false;
      },
    }),
  });
}

if (typeof Element !== "undefined" && typeof Element.prototype.scrollIntoView !== "function") {
  Element.prototype.scrollIntoView = () => {};
}

// @ts-expect-error yes
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

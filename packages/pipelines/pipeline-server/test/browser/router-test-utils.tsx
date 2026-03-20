import type { ReactNode } from "react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { render } from "@testing-library/react";

interface RenderWithQuickActionsRouterOptions {
  initialPath?: string;
  component: () => ReactNode;
}

export async function renderWithQuickActionsRouter({
  initialPath = "/s/local/simple/first-pipeline",
  component,
}: RenderWithQuickActionsRouterOptions) {
  const rootRoute = createRootRoute({
    component: Outlet,
  });

  const pipelineRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/s/$sourceId/$sourceFileId/$pipelineId",
    component,
  });

  const executionsRoute = createRoute({
    getParentRoute: () => pipelineRoute,
    path: "/executions",
    component: () => <div>Executions Index</div>,
  });

  const executionDetailsRoute = createRoute({
    getParentRoute: () => pipelineRoute,
    path: "/executions/$executionId",
    component: () => <div>Execution Details</div>,
  });

  const graphsRoute = createRoute({
    getParentRoute: () => pipelineRoute,
    path: "/graphs",
    component: () => <div>Graphs</div>,
  });

  const inspectRoute = createRoute({
    getParentRoute: () => pipelineRoute,
    path: "/inspect",
    component: () => <div>Inspect</div>,
  });

  const routeTree = rootRoute.addChildren([
    pipelineRoute.addChildren([
      executionsRoute,
      executionDetailsRoute,
      graphsRoute,
      inspectRoute,
    ]),
  ]);

  const history = createMemoryHistory({
    initialEntries: [initialPath],
  });

  const router = createRouter({
    routeTree,
    history,
  });

  const rendered = render(<RouterProvider router={router} />);

  await router.load();

  return {
    ...rendered,
    history,
    router,
  };
}

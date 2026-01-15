import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

// Create a new router instance
export function getRouter() {
  const router = createRouter({
    routeTree,
    context: {},

    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
}

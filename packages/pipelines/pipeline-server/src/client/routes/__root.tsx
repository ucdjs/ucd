import type { PipelinesResponse } from "@ucdjs/pipelines-ui";
import { createRootRoute, notFound, Outlet } from "@tanstack/react-router";
import { SidebarInset, SidebarProvider } from "@ucdjs-internal/shared-ui/ui/sidebar";
import { PipelineSidebar } from "@ucdjs/pipelines-ui";
import { lazy, Suspense } from "react";

const PipelineCommandPalette = lazy(() =>
  import("#components/pipeline-command-palette").then((mod) => ({
    default: mod.PipelineCommandPalette,
  })),
);

export const Route = createRootRoute({
  component: RootLayout,
  loader: async () => {
    const res = await fetch("/api/pipelines");
    if (!res.ok) {
      throw new Response("Failed to load pipelines", { status: res.status });
    }

    const pipelines = await res.json() as PipelinesResponse;

    if (pipelines.errors.length > 0) {
      console.error("Errors loading pipelines:", pipelines.errors);
      throw notFound({
        data: {
          pipelines,
        },
      });
    }

    return {
      pipelines,
    };
  },
});

function RootLayout() {
  return (
    <SidebarProvider>
      {/* <PipelineSidebar /> */}
      <SidebarInset className="flex flex-col min-w-0 overflow-hidden">
        <Outlet />
      </SidebarInset>

      <Suspense fallback={null}>
        {/* <PipelineCommandPalette /> */}
      </Suspense>
    </SidebarProvider>
  );
}

import { createRootRoute, Outlet } from "@tanstack/react-router";
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
});

function RootLayout() {
  return (
    <SidebarProvider>
      <PipelineSidebar />
      <SidebarInset className="flex flex-col min-w-0 overflow-hidden">
        <Outlet />
      </SidebarInset>

      <Suspense fallback={null}>
        <PipelineCommandPalette />
      </Suspense>
    </SidebarProvider>
  );
}

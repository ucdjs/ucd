import { PipelineCommandPalette } from "#components/pipeline-command-palette";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { SidebarInset, SidebarProvider } from "@ucdjs-internal/shared-ui/ui/sidebar";
import { PipelineSidebar } from "@ucdjs/pipelines-ui";

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

      <PipelineCommandPalette />
    </SidebarProvider>
  );
}

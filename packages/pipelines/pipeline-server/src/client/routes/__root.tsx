import { TanStackDevtools } from "@tanstack/react-devtools";
import { HotkeysDevtoolsPanel } from "@tanstack/react-hotkeys-devtools";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
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
    <>
      <SidebarProvider>
        <PipelineSidebar />
        <SidebarInset className="flex flex-col min-w-0 overflow-hidden">
          <Outlet />
        </SidebarInset>

        <Suspense fallback={null}>
          <PipelineCommandPalette />
        </Suspense>
      </SidebarProvider>
      <TanStackDevtools
        config={{
          position: "bottom-right",
        }}
        plugins={[
          {
            name: "Tanstack Router",
            render: <TanStackRouterDevtoolsPanel />,
          },
          {
            name: "Tanstack Query",
            render: <ReactQueryDevtoolsPanel />,
          },
          {
            name: "Tanstack Hotkeys",
            render: <HotkeysDevtoolsPanel />,
          },
        ]}
      />
    </>
  );
}

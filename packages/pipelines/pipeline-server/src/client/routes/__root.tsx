import type { QueryClient } from "@tanstack/react-query";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { HotkeysDevtoolsPanel } from "@tanstack/react-hotkeys-devtools";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createRootRoute, createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { SidebarInset, SidebarProvider } from "@ucdjs-internal/shared-ui/ui/sidebar";
import { configQueryOptions, PipelineSidebar, sourcesQueryOptions } from "@ucdjs/pipelines-ui";
import { lazy, Suspense } from "react";

const PipelineCommandPalette = lazy(() =>
  import("#components/pipeline-command-palette").then((mod) => ({
    default: mod.PipelineCommandPalette,
  })),
);

interface AppRouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<AppRouterContext>()({
  component: RootLayout,
  errorComponent: RootErrorComponent,
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Pipeline Server",
      },
    ],
    links: [
      {
        rel: "icon",
        type: "image/svg+xml",
        href: "/favicon.svg",
      },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(configQueryOptions({
        baseUrl: "",
      })),
      context.queryClient.ensureQueryData(sourcesQueryOptions()),
    ]);
  },
});

function RootLayout() {
  const { data: config } = useSuspenseQuery(configQueryOptions({ baseUrl: "" }));

  return (
    <>
      <SidebarProvider>
        <PipelineSidebar workspaceId={config.data!.workspaceId} version={config.data!.version} />
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

function RootErrorComponent({ error }: { error: Error }) {
  return (
    <div className="flex items-center justify-center h-screen bg-background p-8">
      <div className="max-w-md w-full space-y-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Something went wrong</h1>
          <p className="text-muted-foreground">The application encountered an unexpected error.</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-4">
          <code className="text-sm text-destructive break-all">{error.message}</code>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Reload Application
        </button>
      </div>
    </div>
  );
}

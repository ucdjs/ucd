import type { QueryClient } from "@tanstack/react-query";
import type { LoadError } from "@ucdjs/pipelines-ui";
import type { SourceInfo } from "@ucdjs/pipelines-ui/components/pipeline-sidebar";
import { configQueryOptions, sourceQueryOptions, sourcesQueryOptions } from "#lib/query-options";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { useHotkey } from "@tanstack/react-hotkeys";
import { HotkeysDevtoolsPanel } from "@tanstack/react-hotkeys-devtools";
import { useQuery } from "@tanstack/react-query";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { createRootRouteWithContext, Outlet, useParams } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { SidebarInset, SidebarProvider } from "@ucdjs-internal/shared-ui/ui/sidebar";
import { PipelineSidebar } from "@ucdjs/pipelines-ui";
import { lazy, Suspense, useState } from "react";
import { ErrorLogPanel } from "../components/error-log-panel";
import { KeyboardShortcutsHelp } from "../components/keyboard-shortcuts-help";

const PipelineCommandPalette = lazy(() =>
  import("#components/pipeline-command-palette").then((mod) => ({
    default: mod.PipelineCommandPalette,
  })),
);

export interface AppRouterContext {
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
    const [config, sources] = await Promise.all([
      context.queryClient.ensureQueryData(configQueryOptions()),
      context.queryClient.ensureQueryData(sourcesQueryOptions()),
    ]);

    return { config, sources };
  },
});

function RootLayout() {
  const { config, sources } = Route.useLoaderData();
  const params = useParams({ strict: false });
  const currentSourceId = params.sourceId;

  const [dismissedErrors, setDismissedErrors] = useState<Set<string>>(new Set());
  const [isErrorPanelOpen, setIsErrorPanelOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Only fetch files when a specific source is selected
  const filesQuery = useQuery({
    ...sourceQueryOptions(currentSourceId || ""),
    enabled: !!currentSourceId,
  });

  const files = filesQuery.data?.files || [];
  const errors = filesQuery.data?.errors || [];

  // Filter out dismissed errors
  const activeErrors = errors.filter(
    (error: LoadError) => !dismissedErrors.has(`${error.sourceId}-${error.filePath}-${error.message}`),
  );

  const handleDismissError = (error: LoadError) => {
    setDismissedErrors((prev) => new Set([...prev, `${error.sourceId}-${error.filePath}-${error.message}`]));
  };

  const handleClearAllErrors = () => {
    const allErrorKeys = activeErrors.map(
      (e: LoadError) => `${e.sourceId}-${e.filePath}-${e.message}`,
    );
    setDismissedErrors((prev) => new Set([...prev, ...allErrorKeys]));
  };

  // Hotkeys
  useHotkey("Mod+E", () => {
    if (activeErrors.length > 0) {
      setIsErrorPanelOpen((prev) => !prev);
    }
  });

  useHotkey("Mod+/", () => {
    setIsShortcutsOpen(true);
  });

  const sourceList: SourceInfo[] = sources.map((s: { id: string; type: string }) => ({
    id: s.id,
    type: s.type as "local" | "github" | "gitlab",
  }));

  return (
    <>
      <SidebarProvider>
        <PipelineSidebar
          files={files}
          errors={activeErrors}
          sources={sourceList}
          currentSourceId={currentSourceId}
          onToggleErrorPanel={() => setIsErrorPanelOpen(!isErrorPanelOpen)}
          isErrorPanelOpen={isErrorPanelOpen}
          workspaceId={config.workspaceId}
          version={config.version}
        />
        <SidebarInset className="flex flex-col min-w-0 overflow-hidden">
          <Outlet />
        </SidebarInset>

        <Suspense fallback={null}>
          <PipelineCommandPalette />
        </Suspense>

        {activeErrors.length > 0 && (
          <ErrorLogPanel
            errors={activeErrors}
            isOpen={isErrorPanelOpen}
            onClose={() => setIsErrorPanelOpen(false)}
            onDismiss={handleDismissError}
            onClearAll={handleClearAllErrors}
          />
        )}

        <KeyboardShortcutsHelp
          isOpen={isShortcutsOpen}
          onClose={() => setIsShortcutsOpen(false)}
        />
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

import type { QueryClient } from "@tanstack/react-query";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import {
  createRootRouteWithContext,
  HeadContent,
  Scripts,
  useLocation,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { RootProvider } from "fumadocs-ui/provider/tanstack";
import { AppSidebar } from "@/components/layout/sidebar/app-sidebar";
import { AppNotFound } from "@/components/not-found";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { versionsQueryOptions } from "@/functions/versions";
import GLOBAL_CSS_URL from "../globals.css?url";

export interface AppRouterContext {
  queryClient: QueryClient;
  latestUnicodeVersion: string;
  apiBaseUrl: string;
}

export const Route = createRootRouteWithContext<AppRouterContext>()({
  notFoundComponent: AppNotFound,
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
        title: "UCD.js | Unicode Character Database for JavaScript",
      },
    ],
    links: [
      {
        rel: "icon",
        type: "image/svg+xml",
        href: "/favicon.svg",
      },
      {
        rel: "stylesheet",
        href: GLOBAL_CSS_URL,
      },
    ],
    scripts: [
      import.meta.env.DEV
        ? {
            src: "//unpkg.com/react-scan/dist/auto.global.js",
            crossOrigin: "anonymous",
          }
        : undefined,
    ],
  }),
  loader: async ({ context }) => {
    context.queryClient.prefetchQuery(versionsQueryOptions());

    return {
      ucdjsApiBaseUrl: context.apiBaseUrl,
    };
  },

  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isDocsPage = location.pathname.startsWith("/docs");

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {isDocsPage
          ? (
              <RootProvider>{children}</RootProvider>
            )
          : (
              <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                  {children}
                </SidebarInset>
              </SidebarProvider>
            )}
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
          ]}
        />
        <Scripts />
      </body>
    </html>
  );
}

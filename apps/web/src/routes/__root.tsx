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
import { versionsQueryOptions } from "@/apis/versions";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import appCss from "../styles.css?url";

interface MyRouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
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
        href: appCss,
      },
    ],
  }),

  loader: ({ context }) => {
    // Prefetch versions for SSR - sidebar will have data immediately
    context.queryClient.ensureQueryData(versionsQueryOptions());
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
                <SidebarInset>{children}</SidebarInset>
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

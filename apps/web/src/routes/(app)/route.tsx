import { PageHeader } from "#components/layout/page-header";
import { AppSidebar } from "#components/layout/sidebar/app-sidebar";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SidebarInset, SidebarProvider } from "@ucdjs-internal/shared-ui/ui/sidebar";

export const Route = createFileRoute("/(app)")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="app-shell">
          <div className="app-shell-bg" aria-hidden="true" />
          <div className="app-shell-content">
            <PageHeader />
            <Outlet />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

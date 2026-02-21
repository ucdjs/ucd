import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/(home)")({
  component: HomeLayout,
});

function HomeLayout() {
  return (
    <main className="min-h-svh bg-background">
      <Outlet />
    </main>
  );
}

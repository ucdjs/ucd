import { createFileRoute, Link } from "@tanstack/react-router";
import { ComponentExample } from "@/components/component-example";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/explorer/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      <ComponentExample />

      <Button>Test Button</Button>
      <Button nativeButton={true}>
        Test Native Button
      </Button>

      <Button
        nativeButton={false}
        render={(
          <Link to="/explorer">
            Non-Native Link Button
          </Link>
        )}
      />
    </div>
  );
}

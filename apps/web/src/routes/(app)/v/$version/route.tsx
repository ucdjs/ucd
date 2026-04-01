import { VersionNotFound } from "#components/not-found";
import { versionsQueryOptions } from "#functions/versions";
import { useHotkey } from "@tanstack/react-hotkeys";
import { createFileRoute, notFound, Outlet, redirect } from "@tanstack/react-router";
import { UNICODE_STABLE_VERSION } from "@unicode-utils/core";

export const Route = createFileRoute("/(app)/v/$version")({
  component: VersionLayoutComponent,
  notFoundComponent: VersionNotFoundBoundary,
  async beforeLoad({ params, context }) {
    const version = params.version.toLowerCase();

    if (version === "latest") {
      if (!UNICODE_STABLE_VERSION) {
        throw new Error("No stable version configured");
      }

      throw redirect({
        to: "/v/$version",
        params: { version: UNICODE_STABLE_VERSION },
      });
    }

    const versions = await context.queryClient.ensureQueryData(versionsQueryOptions());
    const exists = versions.some((v) => v.version === version);

    if (!exists) {
      throw notFound();
    }

    return { crumb: `Unicode ${version}` };
  },
  loader: ({ context }) => ({ crumb: context.crumb }),
});

function VersionLayoutComponent() {
  const navigate = Route.useNavigate();
  const { version } = Route.useParams();

  useHotkey("Mod+E", () => {
    navigate({ to: "/file-explorer/$", params: {
      _splat: `${version}`,
    } });
  });
  return <Outlet />;
}

function VersionNotFoundBoundary() {
  const { version } = Route.useParams();

  return <VersionNotFound version={version} />;
}

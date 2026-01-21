import { VersionNotFound } from "#components/not-found";
import { createFileRoute, notFound, Outlet, redirect } from "@tanstack/react-router";
import { createMiddleware } from "@tanstack/react-start";
import { UNICODE_STABLE_VERSION, UNICODE_VERSION_METADATA } from "@unicode-utils/core";

const validateVersionMiddleware = createMiddleware({
  type: "request",
}).server(
  async ({ next, pathname }) => {
    const pathSegments = pathname.split("/");
    const version = pathSegments[2]?.toLowerCase() || "";

    if (version === "latest") {
      const latest = UNICODE_STABLE_VERSION;
      if (!latest) {
        return new Response("No stable version configured", { status: 502 });
      }

      // eslint-disable-next-line no-console
      console.info(`Redirecting 'latest' to stable version: ${latest}`);
      throw redirect({
        to: pathname.replace(/latest/, latest),
      });
    }

    // Verify requested version exists using metadata map
    const exists = Array.isArray(UNICODE_VERSION_METADATA)
      ? UNICODE_VERSION_METADATA.some((m) => m?.version === version)
      : false;

    if (!exists) {
      throw notFound();
    }

    return next();
  },
);

export const Route = createFileRoute("/v/$version")({
  component: VersionLayoutComponent,
  notFoundComponent: VersionNotFoundBoundary,
  server: {
    middleware: [validateVersionMiddleware],
  },
});

function VersionLayoutComponent() {
  return <Outlet />;
}

function VersionNotFoundBoundary() {
  const { version } = Route.useParams();

  return <VersionNotFound version={version} />;
}

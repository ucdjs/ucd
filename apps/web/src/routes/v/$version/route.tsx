import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { createMiddleware } from "@tanstack/react-start"

import { UNICODE_STABLE_VERSION, UNICODE_VERSION_METADATA } from "@unicode-utils/core";

export const validateVersionMiddleware = createMiddleware({
  type: "request"
}).server(
  async ({ next, pathname }) => {
    const pathSegments = pathname.split("/")
    const version = pathSegments[2].toLowerCase() || ""
    console.log("Validating version:", version)

    if (version === "latest") {
      const latest = UNICODE_STABLE_VERSION
      if (!latest) {
        return new Response("No stable version configured", { status: 502 })
      }

      console.info(`Redirecting 'latest' to stable version: ${latest}`)
      throw redirect({
        to: pathname.replace(/latest/, latest),
      })
    }

    // Verify requested version exists using metadata map
    const exists = Array.isArray(UNICODE_VERSION_METADATA)
      ? UNICODE_VERSION_METADATA.some((m) => m?.version === version)
      : false

    if (!exists) {
      return new Response("Version not found", { status: 404 })
    }

    return next()
  },
)

export const Route = createFileRoute('/v/$version')({
  component: VersionLayoutComponent,
  server: {
    middleware: [validateVersionMiddleware],
  }
})

function VersionLayoutComponent() {
  const { version } = Route.useParams()

  return <div>
    <h1>Version: {version}</h1>
    <Outlet />
  </div>
}

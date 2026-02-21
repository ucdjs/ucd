import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/v/")({
  loader({ context }) {
    // If you navigate to /v, we will always redirect to the latest version
    throw redirect({
      to: "/v/$version",
      params: {
        version: context.latestUnicodeVersion,
      },
    });
  },
});

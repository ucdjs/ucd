import { versionsQueryOptions } from "#functions/versions";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(home)/versions")({
  loader: ({ context }) => {
    context.queryClient.prefetchQuery(versionsQueryOptions());
  },
});

import { getLastActiveSource } from "#lib/last-active-source";
import { sourcesQueryOptions } from "#queries/sources";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: async ({ context }) => {
    const sources = await context.queryClient.ensureQueryData(sourcesQueryOptions());
    if (sources.length === 0) return;

    const lastSource = getLastActiveSource();
    if (lastSource && sources.some((s) => s.id === lastSource)) {
      throw redirect({ to: "/s/$sourceId", params: { sourceId: lastSource } });
    }

    throw redirect({ to: "/s/$sourceId", params: { sourceId: sources[0]!.id } });
  },
  component: EmptyState,
});

function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center bg-background">
      <div className="text-center space-y-2">
        <p className="text-lg font-medium">No sources configured</p>
        <p className="text-sm text-muted-foreground">Add a source to get started.</p>
      </div>
    </div>
  );
}

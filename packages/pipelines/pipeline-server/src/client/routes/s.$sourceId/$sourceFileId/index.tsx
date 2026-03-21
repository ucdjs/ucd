import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/s/$sourceId/$sourceFileId/")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/s/$sourceId", params: { sourceId: params.sourceId } });
  },
});

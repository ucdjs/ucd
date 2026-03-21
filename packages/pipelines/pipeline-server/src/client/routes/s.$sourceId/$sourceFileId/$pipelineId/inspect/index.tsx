import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/s/$sourceId/$sourceFileId/$pipelineId/inspect/")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/s/$sourceId/$sourceFileId/$pipelineId/inspect/routes",
      params,
    });
  },
});

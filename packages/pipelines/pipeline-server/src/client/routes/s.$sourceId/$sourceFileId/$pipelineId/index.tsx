import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/s/$sourceId/$sourceFileId/$pipelineId/')(
  {
    component: RouteComponent,
  },
)

function RouteComponent() {
  return <div>Hello "/s/$sourceId/$sourceFileId/$pipelineId/"!</div>
}

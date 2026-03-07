import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/s/$sourceId/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/s/$sourceId/"!</div>
}

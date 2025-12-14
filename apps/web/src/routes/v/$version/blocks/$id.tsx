import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/v/$version/blocks/$id')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/v/$version/blocks/$id"!</div>
}

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/v/$version/u/$hex')({
  component: RouteComponent,
})

function RouteComponent() {
  const { hex, version } = Route.useParams()
  return <div>Hello "/v/{version}/u/{hex}"!</div>
}

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/v/$version/blocks/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { version } = Route.useParams()
  return <div>Hello "/v/{version}/blocks/"!</div>
}

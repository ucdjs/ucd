import { createFileRoute } from '@tanstack/react-router'


export const Route = createFileRoute('/v/$version/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { version } = Route.useParams()
  return <div>
    Hello "/v/{version}/"!
  </div>
}

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/explorer')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/explorer"!</div>
}

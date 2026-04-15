import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(explorer)/reports/rev/$rev')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/(reports)/rev/$rev"!</div>
}

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(explorer)/reports/rev')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/(reports)/rev"!</div>
}

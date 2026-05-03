import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { CompositeComponent, createCompositeComponent, renderServerComponent } from "@tanstack/react-start/rsc";
import * as React from "react";

function Greeting() {
  return <h1>Hello from RSC</h1>;
}

const getCard = createServerFn().handler(async () => {
  const src = await createCompositeComponent(
    (props: { children?: React.ReactNode }) => (
      <div className="card">
        <h2>Server-rendered header</h2>
        <div>{props.children}</div>
      </div>
    ),
  );

  return { src };
});

const getGreeting = createServerFn().handler(async () => {
  const Renderable = await renderServerComponent(<Greeting />);
  return { Renderable };
});

export const Route = createFileRoute("/rsc")({
  ssr: "data-only",
  loader: async () => {
    const { Renderable } = await getGreeting();

    return { Greeting: Renderable, Card: await getCard() };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { Greeting, Card } = Route.useLoaderData();
  return (
    <>
      {Greeting}
      <CompositeComponent src={Card.src}>
        <Counter />
      </CompositeComponent>
    </>
  );
}

function Counter() {
  const [count, setCount] = React.useState(0);
  return (
    <div>
      <p>
        Counter:
        {count}
      </p>
      <button onClick={() => setCount((c) => c + 1)}>Increment</button>
    </div>
  );
}

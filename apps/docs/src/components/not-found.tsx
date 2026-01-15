import { Link } from "@tanstack/react-router";

interface NotFoundLayoutProps {
  title: string;
  description: string;
  hint?: string;
  actions?: React.ReactNode;
}

export function NotFoundLayout({ title, description, hint, actions }: NotFoundLayoutProps) {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="max-w-lg space-y-5 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
          Page not found
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold leading-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {hint
          ? (
              <div className="rounded-md border bg-muted/60 px-3 py-2 text-left text-sm font-mono text-muted-foreground">
                {hint}
              </div>
            )
          : null}
        {actions
          ? (
              <div className="flex flex-wrap justify-center gap-2">{actions}</div>
            )
          : null}
      </div>
    </div>
  );
}

export function DocsNotFound({ path }: { path?: string }) {
  return (
    <NotFoundLayout
      title="That documentation page does not exist"
      description="Check the URL or browse the docs index instead."
      hint={path ? `/${path}` : undefined}
      actions={(
        <Link
          to="/$"
          params={{ _splat: "ucdjs" }}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Back to docs
        </Link>
      )}
    />
  );
}

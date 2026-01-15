import { Link } from "@tanstack/react-router";
import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

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
          <AlertCircle className="size-4" />
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

export function AppNotFound() {
  return (
    <NotFoundLayout
      title="We couldn't find that page"
      description="The address might be incorrect or the page was moved."
      actions={(
        <>
          <Button render={<Link to="/">Go home</Link>} />
          <Button variant="outline" render={<a href="https://docs.ucdjs.dev">View documentation</a>} />
        </>
      )}
    />
  );
}

export function ExplorerNotFound({ path }: { path?: string }) {
  return (
    <NotFoundLayout
      title="File or folder not found"
      description="The path you requested isn't available in this store."
      hint={path ? `/${path}` : undefined}
      actions={(
        <>
          <Button render={(
            <Link to="/file-explorer/$" params={{ _splat: "" }}>
              Back to explorer
            </Link>
          )}
          />
          <Button variant="outline" render={<Link to="/">Go home</Link>} />
        </>
      )}
    />
  );
}

export function VersionNotFound({ version }: { version?: string }) {
  return (
    <NotFoundLayout
      title="Unicode version not available"
      description="That version isn't published yet or doesn't exist."
      hint={version ? `Requested: ${version}` : undefined}
      actions={(
        <>
          <Button render={<Link to="/">Browse versions</Link>} />
          <Button variant="outline" render={<a href="https://docs.ucdjs.dev">Read docs</a>} />
        </>
      )}
    />
  );
}

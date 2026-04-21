import { Link } from "@tanstack/react-router";
import { Button, UcdLogo } from "@ucdjs-internal/shared-ui/components";
import { ArrowLeft } from "lucide-react";

export function ReportsExplorerHeader() {
  return (
    <header className="shrink-0">
      <div className="border-b bg-background px-4">
        <div className="flex h-12 items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link to="/" className="hover:opacity-80 transition-opacity" aria-label="Go to UCD site home">
              <UcdLogo className="size-7 shrink-0" />
            </Link>
            <Link
              to="/reports"
              className="text-sm font-semibold transition-colors hover:text-foreground"
            >
              Reports Explorer
            </Link>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            nativeButton={false}
            render={(
              <Link to="/">
                <ArrowLeft className="size-4" />
                Back to site
              </Link>
            )}
          />
        </div>
      </div>
    </header>
  );
}

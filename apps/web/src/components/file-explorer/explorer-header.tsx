import { versionsQueryOptions } from "#functions/versions";
import { useQuery } from "@tanstack/react-query";
import { Link, useChildMatches } from "@tanstack/react-router";
import { Button, UcdLogo } from "@ucdjs-internal/shared-ui/components";
import { ArrowLeft } from "lucide-react";

export function ExplorerHeader() {
  const [childMatch] = useChildMatches();
  const { data: versions } = useQuery(versionsQueryOptions());

  const currentPath = (childMatch?.params as { _splat?: string })?._splat ?? "";
  const versionCandidate = currentPath.split("/").find(Boolean);
  const currentVersion = versions?.some((version) => version.version === versionCandidate)
    ? versionCandidate
    : null;

  return (
    <header className="shrink-0">
      <div className="border-b bg-background px-4">
        <div className="flex h-12 items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link to="/" className="hover:opacity-80 transition-opacity" aria-label="Go to UCD site home">
              <UcdLogo className="size-7 shrink-0" />
            </Link>
            <Link
              to="/file-explorer/$"
              params={{ _splat: "" }}
              className="text-sm font-semibold transition-colors hover:text-foreground"
            >
              File Explorer
            </Link>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            nativeButton={false}
            render={currentVersion
              ? (
                  <Link to="/v/$version" params={{ version: currentVersion }}>
                    <ArrowLeft className="size-4" />
                    Back to Unicode
                    {" "}
                    {currentVersion}
                  </Link>
                )
              : (
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

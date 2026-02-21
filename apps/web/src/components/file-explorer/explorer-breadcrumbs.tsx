import { Link, useMatch } from "@tanstack/react-router";
import { useClipboard } from "@ucdjs-internal/shared-ui/hooks";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@ucdjs-internal/shared-ui/ui/breadcrumb";
import { Button } from "@ucdjs-internal/shared-ui/ui/button";
import { ChevronRight, Copy, CopyCheck, CopyX, FolderOpen } from "lucide-react";
import { Fragment, useState } from "react";

export function ExplorerBreadcrumbs() {
  const match = useMatch({ from: "/(explorer)/file-explorer" });
  const path = (match?.params as { _splat?: string })?._splat || "";
  const pathSegments = path ? path.split("/").filter(Boolean) : [];
  const isRoot = pathSegments.length === 0;
  const { copy, copied, error } = useClipboard();

  function copyToClipboard() {
    copy(`/${path}`);
  }

  return (
    <Breadcrumb className="flex-1 overflow-hidden">
      <BreadcrumbList className="flex-nowrap text-sm">
        <BreadcrumbItem className="shrink-0">
          {isRoot
            ? (
                <BreadcrumbPage className="flex items-center gap-1.5 font-semibold">
                  <FolderOpen className="size-3.5 text-amber-500" />
                  Files
                </BreadcrumbPage>
              )
            : (
                <BreadcrumbLink
                  render={(
                    <Link
                      to="/file-explorer/$"
                      params={{ _splat: "" }}
                    />
                  )}
                  className="flex items-center gap-1.5 font-semibold text-foreground hover:text-foreground"
                >
                  <FolderOpen className="size-3.5 text-amber-500" />
                  Files
                </BreadcrumbLink>
              )}
        </BreadcrumbItem>

        {pathSegments.map((segment, index) => {
          const segmentPath = pathSegments.slice(0, index + 1).join("/");
          const isLast = index === pathSegments.length - 1;

          return (
            <Fragment key={segmentPath}>
              <BreadcrumbSeparator className="shrink-0">
                <ChevronRight className="size-3.5" />
              </BreadcrumbSeparator>
              <BreadcrumbItem className="min-w-0">
                {isLast
                  ? (
                      <BreadcrumbPage className="truncate font-semibold max-w-60" title={segment}>
                        {segment}
                      </BreadcrumbPage>
                    )
                  : (
                      <BreadcrumbLink
                        render={(
                          <Link
                            to="/file-explorer/$"
                            params={{ _splat: segmentPath }}
                          />
                        )}
                        className="truncate max-w-40 text-muted-foreground hover:text-foreground transition-colors"
                        title={segment}
                      >
                        {segment}
                      </BreadcrumbLink>
                    )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}

        {!isRoot && (
          <Button variant="ghost" onClick={copyToClipboard}>
            {error
              ? <CopyX className="size-3 text-red-500" />
              : copied
                ? <CopyCheck className="size-3 text-green-500" />
                : <Copy className="size-3" />}
          </Button>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

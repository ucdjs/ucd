import type { ReactElement, ReactNode } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@ucdjs-internal/shared-ui/components";
import { ChevronRight } from "lucide-react";
import { Fragment } from "react";

export interface ExplorerBreadcrumbSegment {
  key: string;
  label: string;
  title?: string;
  current?: boolean;
  render?: ReactElement;
}

export interface ExplorerBreadcrumbsBaseProps {
  rootLabel: string;
  rootIcon: ReactNode;
  isRoot: boolean;
  rootRender?: ReactElement;
  segments: ExplorerBreadcrumbSegment[];
  trailing?: ReactNode;
}

export function ExplorerBreadcrumbsBase({
  rootLabel,
  rootIcon,
  isRoot,
  rootRender,
  segments,
  trailing,
}: ExplorerBreadcrumbsBaseProps) {
  return (
    <Breadcrumb className="flex-1 overflow-hidden">
      <BreadcrumbList className="flex-nowrap text-sm">
        <BreadcrumbItem className="shrink-0">
          {isRoot
            ? (
                <BreadcrumbPage className="flex items-center gap-1.5 font-semibold">
                  {rootIcon}
                  {rootLabel}
                </BreadcrumbPage>
              )
            : (
                <BreadcrumbLink
                  render={rootRender}
                  className="flex items-center gap-1.5 font-semibold text-foreground hover:text-foreground"
                >
                  {rootIcon}
                  {rootLabel}
                </BreadcrumbLink>
              )}
        </BreadcrumbItem>

        {segments.map((segment) => (
          <Fragment key={segment.key}>
            <BreadcrumbSeparator className="shrink-0">
              <ChevronRight className="size-3.5" />
            </BreadcrumbSeparator>
            <BreadcrumbItem className="min-w-0">
              {segment.current
                ? (
                    <BreadcrumbPage className="truncate font-semibold max-w-60" title={segment.title ?? segment.label}>
                      {segment.label}
                    </BreadcrumbPage>
                  )
                : (
                    <BreadcrumbLink
                      render={segment.render}
                      className="truncate max-w-40 text-muted-foreground hover:text-foreground transition-colors"
                      title={segment.title ?? segment.label}
                    >
                      {segment.label}
                    </BreadcrumbLink>
                  )}
            </BreadcrumbItem>
          </Fragment>
        ))}

        {trailing}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

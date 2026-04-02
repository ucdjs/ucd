import { isMatch, Link, useMatches } from "@tanstack/react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Separator,
  SidebarTrigger,
} from "@ucdjs-internal/shared-ui/components";
import { Fragment } from "react";

export function AppHeader() {
  const matches = useMatches();

  if (matches.some((match) => match.status === "pending")) return null;

  const matchesWithCrumbs = matches.filter((match) =>
    isMatch(match, "loaderData.crumb"),
  );

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/">Home</Link>} />
            </BreadcrumbItem>
            {matchesWithCrumbs.map((match, i) => {
              const isLast = i === matchesWithCrumbs.length - 1;
              return (
                <Fragment key={match.id}>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {isLast
                      ? <BreadcrumbPage>{match.loaderData?.crumb}</BreadcrumbPage>
                      : (
                          <BreadcrumbLink
                            render={<Link from={match.fullPath}>{match.loaderData?.crumb}</Link>}
                          />
                        )}
                  </BreadcrumbItem>
                </Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  );
}

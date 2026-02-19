import { Link } from "@tanstack/react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@ucdjs-internal/shared-ui/ui/breadcrumb";
import { Separator } from "@ucdjs-internal/shared-ui/ui/separator";
import { SidebarTrigger } from "@ucdjs-internal/shared-ui/ui/sidebar";

interface VersionHeaderProps {
  version: string;
  title: string;
}

export function VersionHeader({ version, title }: VersionHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink render={<Link to="/">Home</Link>} />
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink render={(
                <Link to="/v/$version" params={{ version }}>
                  Unicode
                  {" "}
                  {version}
                </Link>
              )}
              />
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>{title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  );
}

import { Link } from "@tanstack/react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@ucdjs-internal/shared-ui/components";

interface VersionHeaderProps {
  version: string;
  title: string;
}

export function VersionHeader({ version, title }: VersionHeaderProps) {
  return (
    <header className="flex items-center gap-4">
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
    </header>
  );
}

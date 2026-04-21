import type { ReactNode } from "react";
import { cn } from "@ucdjs-internal/shared-ui";
import { SidebarContent, SidebarHeader, SidebarInput } from "@ucdjs-internal/shared-ui/components";
import { Search } from "lucide-react";

export interface ExplorerSidebarShellProps {
  query: string;
  onQueryChange: (value: string) => void;
  placeholder: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function ExplorerSidebarShell({
  query,
  onQueryChange,
  placeholder,
  children,
  className,
  contentClassName,
}: ExplorerSidebarShellProps) {
  return (
    <div className={cn("flex h-full flex-col", className)}>
      <SidebarHeader className="sticky top-0 z-10 bg-background px-4 py-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <SidebarInput
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={placeholder}
            className="h-8 pl-8"
          />
        </div>
      </SidebarHeader>
      <SidebarContent className={cn("px-2 pb-4", contentClassName)} hideScrollbar={false}>
        {children}
      </SidebarContent>
    </div>
  );
}

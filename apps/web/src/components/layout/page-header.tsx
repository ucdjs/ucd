import type { HTMLAttributes } from "react";
import { cn } from "@ucdjs-internal/shared-ui/lib/utils";
import { SidebarTrigger } from "@ucdjs-internal/shared-ui/ui/sidebar";

export function PageHeader({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <header
      className={cn(
        "sticky top-0 z-10 flex h-10 shrink-0 items-center border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 md:hidden",
        className,
      )}
      {...props}
    >
      <div className="flex items-center px-3">
        <SidebarTrigger className="-ml-1" />
      </div>
    </header>
  );
}

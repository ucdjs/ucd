import { Link } from "@tanstack/react-router";
import { ArrowUp, FolderUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface ParentDirectoryProps {
  currentPath: string;
  viewMode: "list" | "cards";
}

function getParentPath(path: string): string {
  const parts = path.split("/").filter(Boolean);
  parts.pop();
  return parts.join("/");
}

export function ParentDirectory({ currentPath, viewMode }: ParentDirectoryProps) {
  // Don't show parent link at root
  if (!currentPath) {
    return null;
  }

  const parentPath = getParentPath(currentPath);

  if (viewMode === "cards") {
    return (
      <Card size="sm" className="hover:ring-primary/30 transition-all hover:ring-2 group">
        <CardContent className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <FolderUp className="size-4 text-muted-foreground group-hover:text-primary" />
            <Link
              to="/file-explorer/$"
              params={{ _splat: parentPath || "" }}
              search
              className="truncate font-medium text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              ..
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">Parent directory</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Link
      to="/file-explorer/$"
      params={{ _splat: parentPath || "" }}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md group",
        "hover:bg-muted/50 transition-colors",
        "border-b border-border/50",
      )}
    >
      <FolderUp className="size-4 text-muted-foreground group-hover:text-primary shrink-0" />
      <span className="flex-1 text-sm text-muted-foreground group-hover:text-primary transition-colors">
        ..
      </span>
      <ArrowUp className="size-3 text-muted-foreground/50" />
    </Link>
  );
}

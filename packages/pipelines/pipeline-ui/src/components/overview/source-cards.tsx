import { SiGithub, SiGitlab } from "@icons-pack/react-simple-icons";
import { Link } from "@tanstack/react-router";
import { cn } from "@ucdjs-internal/shared-ui/lib/utils";
import { Card, CardContent } from "@ucdjs-internal/shared-ui/ui/card";
import { AlertCircle, FolderGit } from "lucide-react";

interface SourceInfo {
  id: string;
  type: "local" | "github" | "gitlab";
  fileCount?: number;
  pipelineCount?: number;
  errorCount?: number;
}

export interface SourceCardsProps {
  sources: SourceInfo[];
  compact?: boolean;
}

const sourceTypeConfig = {
  local: {
    icon: FolderGit,
    label: "Local",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  github: {
    icon: SiGithub,
    label: "GitHub",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  gitlab: {
    icon: SiGitlab,
    label: "GitLab",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
};

export function SourceCards({ sources, compact = false }: SourceCardsProps) {
  return (
    <Card className="h-full">
      <CardContent className={cn("p-4", compact && "p-3")}>
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Sources</h3>
        <div className={cn("grid grid-cols-1 gap-3", compact && "gap-2")}>
          {sources.map((source) => {
            const config = sourceTypeConfig[source.type];
            const Icon = config.icon;
            const hasErrors = (source.errorCount ?? 0) > 0;

            return (
              <Link
                to="/$sourceId"
                params={{ sourceId: source.id }}
                key={source.id}
                className={cn(
                  "flex items-start gap-3 rounded-lg border text-left",
                  "transition-all duration-200",
                  "hover:border-primary hover:shadow-sm",
                  "focus:outline-none focus:ring-2 focus:ring-primary/20",
                  compact ? "p-2" : "p-3",
                )}
              >
                <div
                  className={cn(
                    "rounded-lg flex items-center justify-center shrink-0",
                    config.bgColor,
                    compact ? "w-9 h-9" : "w-10 h-10",
                  )}
                >
                  <Icon className={cn(compact ? "w-4 h-4" : "w-5 h-5", config.color)} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground truncate">{source.id}</span>
                    {hasErrors && (
                      <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn("text-xs px-2 py-0.5 rounded-full", config.bgColor, config.color)}>
                      {config.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {source.fileCount ?? 0}
                      {" "}
                      files ·
                      {source.pipelineCount ?? 0}
                      {" "}
                      pipelines
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

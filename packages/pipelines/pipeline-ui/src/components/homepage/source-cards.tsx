import { cn } from "@ucdjs-internal/shared-ui/lib/utils";
import { Card, CardContent } from "@ucdjs-internal/shared-ui/ui/card";
import { AlertCircle, FolderGit, Github, Gitlab } from "lucide-react";

interface SourceInfo {
  id: string;
  type: "local" | "github" | "gitlab";
  fileCount?: number;
  pipelineCount?: number;
  errorCount?: number;
}

export interface SourceCardsProps {
  sources: SourceInfo[];
  onSourceClick?: (sourceId: string) => void;
}

const sourceTypeConfig = {
  local: {
    icon: FolderGit,
    label: "Local",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  github: {
    icon: Github,
    label: "GitHub",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  gitlab: {
    icon: Gitlab,
    label: "GitLab",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
};

export function SourceCards({ sources, onSourceClick }: SourceCardsProps) {
  return (
    <Card className="h-full">
      <CardContent className="p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Sources</h3>
        <div className="grid grid-cols-1 gap-3">
          {sources.map((source) => {
            const config = sourceTypeConfig[source.type];
            const Icon = config.icon;
            const hasErrors = (source.errorCount ?? 0) > 0;

            return (
              <button
                key={source.id}
                onClick={() => onSourceClick?.(source.id)}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border text-left",
                  "transition-all duration-200",
                  "hover:border-primary hover:shadow-sm",
                  "focus:outline-none focus:ring-2 focus:ring-primary/20",
                )}
              >
                {/* Icon */}
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", config.bgColor)}>
                  <Icon className={cn("w-5 h-5", config.color)} />
                </div>

                {/* Content */}
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
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

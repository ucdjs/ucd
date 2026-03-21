import { cn } from "@ucdjs-internal/shared-ui";
import { Button } from "@ucdjs-internal/shared-ui/ui/button";

export interface VersionSelectorProps {
  versions: string[];
  selectedVersions: Set<string>;
  onToggleVersion: (version: string) => void;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  className?: string;
}

export function VersionSelector({
  versions,
  selectedVersions,
  onToggleVersion,
  onSelectAll,
  onDeselectAll,
  className,
}: VersionSelectorProps) {
  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">
          Versions (
          {selectedVersions.size}
          /
          {versions.length}
          )
        </span>
        {(onSelectAll || onDeselectAll) && (
          <div className="flex gap-2 text-xs">
            {onSelectAll && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onSelectAll}
                className="h-auto px-0 text-muted-foreground hover:text-foreground"
              >
                All
              </Button>
            )}
            {onDeselectAll && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDeselectAll}
                className="h-auto px-0 text-muted-foreground hover:text-foreground"
              >
                None
              </Button>
            )}
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {versions.map((version, index) => (
          <Button
            key={`${version}-${index}`}
            type="button"
            size="sm"
            variant={selectedVersions.has(version) ? "default" : "secondary"}
            onClick={() => onToggleVersion(version)}
            className={cn(
              "rounded text-xs",
              !selectedVersions.has(version) && "hover:bg-secondary/80",
            )}
          >
            {version}
          </Button>
        ))}
      </div>
    </div>
  );
}

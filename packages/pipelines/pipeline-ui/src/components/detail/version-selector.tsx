import { cn } from "#lib/utils";
import { useMemo } from "react";

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
  const versionToggles = useMemo(() => {
    const map = new Map<string, () => void>();
    for (const v of versions) {
      map.set(v, () => onToggleVersion(v));
    }
    return map;
  }, [versions, onToggleVersion]);

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
              <button
                type="button"
                onClick={onSelectAll}
                className="text-muted-foreground hover:text-foreground"
              >
                All
              </button>
            )}
            {onDeselectAll && (
              <button
                type="button"
                onClick={onDeselectAll}
                className="text-muted-foreground hover:text-foreground"
              >
                None
              </button>
            )}
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {versions.map((version) => (
          <VersionTag
            key={version}
            version={version}
            selected={selectedVersions.has(version)}
            onToggle={versionToggles.get(version)}
          />
        ))}
      </div>
    </div>
  );
}

function VersionTag({
  version,
  selected,
  onToggle,
}: {
  version: string;
  selected: boolean;
  onToggle?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "px-2.5 py-1 text-xs rounded transition-colors",
        selected
          ? "bg-primary text-primary-foreground"
          : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      )}
    >
      {version}
    </button>
  );
}

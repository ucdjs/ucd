import { cn } from "#lib/utils";
import { memo, useCallback, useMemo, useState } from "react";

// ---------------------------------------------------------------------------
// VersionTag
// ---------------------------------------------------------------------------

export interface VersionTagProps {
  version: string;
  selected: boolean;
  onToggle?: () => void;
  className?: string;
}

/**
 * Selectable version tag/badge
 */
export const VersionTag = memo(({
  version,
  selected,
  onToggle,
  className,
}: VersionTagProps) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "px-2.5 py-1 text-xs rounded transition-colors",
        selected
          ? "bg-primary text-primary-foreground"
          : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        className,
      )}
    >
      {version}
    </button>
  );
});

export interface VersionSelectorProps {
  versions: string[];
  selectedVersions: Set<string>;
  onToggleVersion: (version: string) => void;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  className?: string;
}

/**
 * Version selector with all/none controls
 */
export const VersionSelector = memo(({
  versions,
  selectedVersions,
  onToggleVersion,
  onSelectAll,
  onDeselectAll,
  className,
}: VersionSelectorProps) => {
  // Memoize version toggle handlers
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
});

// ---------------------------------------------------------------------------
// RouteItem
// ---------------------------------------------------------------------------

export interface RouteItemProps {
  route: { id: string; cache: boolean };
  onClick?: () => void;
  className?: string;
}

/**
 * Pipeline route list item
 */
export const RouteItem = memo(({
  route,
  onClick,
  className,
}: RouteItemProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between py-2 px-3 rounded-md transition-colors",
        onClick
          ? "hover:bg-accent cursor-pointer text-left"
          : "hover:bg-accent/30",
        className,
      )}
    >
      <code className="text-xs font-medium text-foreground">{route.id}</code>
      <div className="flex items-center gap-2">
        {route.cache && (
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            cached
          </span>
        )}
        {onClick && (
          <svg
            className="w-3.5 h-3.5 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
            />
          </svg>
        )}
      </div>
    </button>
  );
});

export interface RouteListProps {
  routes: Array<{ id: string; cache: boolean }>;
  onRouteClick?: (routeId: string) => void;
  className?: string;
}

/**
 * List of pipeline routes
 */
export const RouteList = memo(({
  routes,
  onRouteClick,
  className,
}: RouteListProps) => {
  return (
    <section className={className}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs text-muted-foreground uppercase tracking-wider">
          Routes
        </h2>
        <span className="text-xs text-muted-foreground">
          {routes.length}
        </span>
      </div>
      <div className="bg-card rounded-lg border border-border">
        {routes.map((route, index) => (
          <div
            key={route.id}
            className={cn(
              index !== routes.length - 1 && "border-b border-border"
            )}
          >
            <RouteItem
              route={route}
              onClick={onRouteClick ? () => onRouteClick(route.id) : undefined}
            />
          </div>
        ))}
      </div>
    </section>
  );
});

// ---------------------------------------------------------------------------
// SourceItem
// ---------------------------------------------------------------------------

export interface SourceItemProps {
  source: { id: string };
  className?: string;
}

/**
 * Pipeline source list item
 */
export const SourceItem = memo(({
  source,
  className,
}: SourceItemProps) => {
  return (
    <div className={cn("py-1.5 px-2 rounded hover:bg-accent/30", className)}>
      <code className="text-xs text-foreground/80">{source.id}</code>
    </div>
  );
});

export interface SourceListProps {
  sources: Array<{ id: string }>;
  className?: string;
}

/**
 * List of pipeline sources
 */
export const SourceList = memo(({
  sources,
  className,
}: SourceListProps) => {
  return (
    <section className={className}>
      <h2 className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
        Sources (
        {sources.length}
        )
      </h2>
      <div className="bg-card rounded-lg border border-border divide-y divide-border">
        {sources.map((source) => (
          <SourceItem key={source.id} source={source} />
        ))}
      </div>
    </section>
  );
});

// ---------------------------------------------------------------------------
// useVersionSelection hook
// ---------------------------------------------------------------------------

export interface UseVersionSelectionReturn {
  selectedVersions: Set<string>;
  toggleVersion: (version: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  setVersions: (versions: string[]) => void;
}

/**
 * Hook to manage version selection state
 */
export function useVersionSelection(
  initialVersions: string[] = [],
): UseVersionSelectionReturn {
  const [selectedVersions, setSelectedVersions] = useState<Set<string>>(
    () => new Set(initialVersions),
  );

  const toggleVersion = useCallback((version: string) => {
    setSelectedVersions((prev) => {
      const next = new Set(prev);
      if (next.has(version)) {
        next.delete(version);
      } else {
        next.add(version);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    // Requires knowing the full version list - handled via setVersions
  }, []);

  const deselectAll = useCallback(() => {
    setSelectedVersions(new Set());
  }, []);

  const setVersions = useCallback((versions: string[]) => {
    setSelectedVersions(new Set(versions));
  }, []);

  return {
    selectedVersions,
    toggleVersion,
    selectAll,
    deselectAll,
    setVersions,
  };
}

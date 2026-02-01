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
          ? "bg-zinc-100 text-zinc-900"
          : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700",
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
        <span className="text-xs text-zinc-500 uppercase tracking-wider">
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
                className="text-zinc-400 hover:text-zinc-200"
              >
                All
              </button>
            )}
            {onDeselectAll && (
              <button
                type="button"
                onClick={onDeselectAll}
                className="text-zinc-400 hover:text-zinc-200"
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
  className?: string;
}

/**
 * Pipeline route list item
 */
export const RouteItem = memo(({
  route,
  className,
}: RouteItemProps) => {
  return (
    <div className={cn(
      "flex items-center justify-between py-1.5 px-2 rounded hover:bg-zinc-800/50",
      className,
    )}
    >
      <code className="text-xs text-zinc-300">{route.id}</code>
      {route.cache && (
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
          cached
        </span>
      )}
    </div>
  );
});

export interface RouteListProps {
  routes: Array<{ id: string; cache: boolean }>;
  className?: string;
}

/**
 * List of pipeline routes
 */
export const RouteList = memo(({
  routes,
  className,
}: RouteListProps) => {
  return (
    <section className={className}>
      <h2 className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
        Routes (
        {routes.length}
        )
      </h2>
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 divide-y divide-zinc-800">
        {routes.map((route) => (
          <RouteItem key={route.id} route={route} />
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
    <div className={cn("py-1.5 px-2 rounded hover:bg-zinc-800/50", className)}>
      <code className="text-xs text-zinc-300">{source.id}</code>
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
      <h2 className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
        Sources (
        {sources.length}
        )
      </h2>
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 divide-y divide-zinc-800">
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

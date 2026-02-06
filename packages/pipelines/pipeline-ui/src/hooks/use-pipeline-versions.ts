import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY_PREFIX = "ucd-versions-";

export interface UsePipelineVersionsReturn {
  selectedVersions: Set<string>;
  toggleVersion: (version: string) => void;
  selectAll: (versions: string[]) => void;
  deselectAll: () => void;
  isLoaded: boolean;
}

function getStorageKey(pipelineId: string): string {
  return `${STORAGE_KEY_PREFIX}${pipelineId}`;
}

function loadVersionsFromStorage(pipelineId: string, allVersions: string[]): Set<string> {
  if (typeof window === "undefined") {
    return new Set(allVersions);
  }

  try {
    const stored = localStorage.getItem(getStorageKey(pipelineId));
    if (stored) {
      const parsed = JSON.parse(stored) as string[];
      // Filter to only valid versions
      const validVersions = parsed.filter((v) => allVersions.includes(v));
      if (validVersions.length > 0) {
        return new Set(validVersions);
      }
    }
  } catch {
    // Fall through to default
  }

  return new Set(allVersions);
}

function saveVersionsToStorage(pipelineId: string, versions: Set<string>): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(getStorageKey(pipelineId), JSON.stringify(Array.from(versions)));
  } catch {
    // Ignore storage errors
  }
}

export function usePipelineVersions(
  pipelineId: string,
  allVersions: string[],
): UsePipelineVersionsReturn {
  const [selectedVersions, setSelectedVersions] = useState<Set<string>>(
    () => new Set(allVersions),
  );
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount and when pipeline changes
  useEffect(() => {
    const loaded = loadVersionsFromStorage(pipelineId, allVersions);
    setSelectedVersions(loaded);
    setIsLoaded(true);
  }, [pipelineId, allVersions]);

  // Persist to localStorage when versions change
  useEffect(() => {
    if (isLoaded) {
      saveVersionsToStorage(pipelineId, selectedVersions);
    }
  }, [pipelineId, selectedVersions, isLoaded]);

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

  const selectAll = useCallback(
    (versions: string[]) => {
      setSelectedVersions(new Set(versions));
    },
    [],
  );

  const deselectAll = useCallback(() => {
    setSelectedVersions(new Set());
  }, []);

  return {
    selectedVersions,
    toggleVersion,
    selectAll,
    deselectAll,
    isLoaded,
  };
}

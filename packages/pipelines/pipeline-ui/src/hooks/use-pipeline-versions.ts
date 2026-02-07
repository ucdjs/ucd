import { useCallback, useMemo, useState } from "react";

const STORAGE_KEY_PREFIX = "ucd-versions-";

export interface UsePipelineVersionsReturn {
  selectedVersions: Set<string>;
  toggleVersion: (version: string) => void;
  selectAll: (versions: string[]) => void;
  deselectAll: () => void;
}

function getStorageKey(storageKey: string): string {
  return `${STORAGE_KEY_PREFIX}${storageKey}`;
}

function loadVersionsFromStorage(storageKey: string, allVersions: string[]): Set<string> {
  if (typeof window === "undefined") {
    return new Set(allVersions);
  }

  try {
    const stored = localStorage.getItem(getStorageKey(storageKey));
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

function saveVersionsToStorage(storageKey: string, versions: Set<string>): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(getStorageKey(storageKey), JSON.stringify(Array.from(versions)));
  } catch {
    // Ignore storage errors
  }
}

function sanitizeVersions(versions: Iterable<string>, allVersions: string[]): Set<string> {
  const valid = Array.from(versions).filter((v) => allVersions.includes(v));
  return new Set(valid.length > 0 ? valid : allVersions);
}

export function usePipelineVersions(
  pipelineId: string,
  allVersions: string[],
  storageKeyOverride?: string,
): UsePipelineVersionsReturn {
  const [overridesByPipeline, setOverridesByPipeline] = useState<Record<string, string[]>>({});
  const storageKey = storageKeyOverride ?? pipelineId;

  const baseSelection = useMemo(
    () => loadVersionsFromStorage(storageKey, allVersions),
    [storageKey, allVersions],
  );

  const selectedVersions = useMemo(() => {
    const override = overridesByPipeline[pipelineId];
    const source = override ? new Set(override) : baseSelection;
    return sanitizeVersions(source, allVersions);
  }, [allVersions, baseSelection, overridesByPipeline, pipelineId]);

  const toggleVersion = useCallback((version: string) => {
    setOverridesByPipeline((prev) => {
      const current = prev[pipelineId] ? new Set(prev[pipelineId]) : selectedVersions;
      const next = new Set(current);
      if (next.has(version)) {
        next.delete(version);
      } else {
        next.add(version);
      }
      const sanitized = sanitizeVersions(next, allVersions);
      saveVersionsToStorage(storageKey, sanitized);
      return {
        ...prev,
        [pipelineId]: Array.from(sanitized),
      };
    });
  }, [allVersions, pipelineId, selectedVersions, storageKey]);

  const selectAll = useCallback(
    (versions: string[]) => {
      const sanitized = sanitizeVersions(versions, allVersions);
      saveVersionsToStorage(storageKey, sanitized);
      setOverridesByPipeline((prev) => ({
        ...prev,
        [pipelineId]: Array.from(sanitized),
      }));
    },
    [allVersions, pipelineId, storageKey],
  );

  const deselectAll = useCallback(() => {
    const sanitized = sanitizeVersions([], allVersions);
    saveVersionsToStorage(storageKey, sanitized);
    setOverridesByPipeline((prev) => ({
      ...prev,
      [pipelineId]: Array.from(sanitized),
    }));
  }, [allVersions, pipelineId, storageKey]);

  return {
    selectedVersions,
    toggleVersion,
    selectAll,
    deselectAll,
  };
}

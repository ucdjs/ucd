import { useCallback, useMemo, useState } from "react";

const STORAGE_KEY_PREFIX = "ucd-versions-";

export interface UsePipelineVersionsReturn {
  selectedVersions: Set<string>;
  toggleVersion: (version: string) => void;
  selectAll: (versions: string[]) => void;
  deselectAll: () => void;
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

function sanitizeVersions(versions: Iterable<string>, allVersions: string[]): Set<string> {
  const valid = Array.from(versions).filter((v) => allVersions.includes(v));
  return new Set(valid.length > 0 ? valid : allVersions);
}

export function usePipelineVersions(
  pipelineId: string,
  allVersions: string[],
): UsePipelineVersionsReturn {
  const [overridesByPipeline, setOverridesByPipeline] = useState<Record<string, string[]>>({});

  const baseSelection = useMemo(
    () => loadVersionsFromStorage(pipelineId, allVersions),
    [pipelineId, allVersions],
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
      saveVersionsToStorage(pipelineId, sanitized);
      return {
        ...prev,
        [pipelineId]: Array.from(sanitized),
      };
    });
  }, [allVersions, pipelineId, selectedVersions]);

  const selectAll = useCallback(
    (versions: string[]) => {
      const sanitized = sanitizeVersions(versions, allVersions);
      saveVersionsToStorage(pipelineId, sanitized);
      setOverridesByPipeline((prev) => ({
        ...prev,
        [pipelineId]: Array.from(sanitized),
      }));
    },
    [allVersions, pipelineId],
  );

  const deselectAll = useCallback(() => {
    const sanitized = sanitizeVersions([], allVersions);
    saveVersionsToStorage(pipelineId, sanitized);
    setOverridesByPipeline((prev) => ({
      ...prev,
      [pipelineId]: Array.from(sanitized),
    }));
  }, [allVersions, pipelineId]);

  return {
    selectedVersions,
    toggleVersion,
    selectAll,
    deselectAll,
  };
}

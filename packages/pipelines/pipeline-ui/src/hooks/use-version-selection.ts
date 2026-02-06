import { useCallback, useState } from "react";

export interface UseVersionSelectionReturn {
  selectedVersions: Set<string>;
  toggleVersion: (version: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  setVersions: (versions: string[]) => void;
}

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

import { useCallback, useMemo, useSyncExternalStore } from "react";

const STORAGE_KEY_PREFIX = "ucd-versions-";
const STORAGE_EVENT_NAME = "ucd:pipeline-versions";

export interface UsePipelineVersionsReturn {
  selectedVersions: Set<string>;
  toggleVersion: (version: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
}

function getStorageKey(storageKey: string): string {
  return `${STORAGE_KEY_PREFIX}${storageKey}`;
}

function readVersionsSnapshot(storageKey: string): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return localStorage.getItem(getStorageKey(storageKey));
  } catch {
    return null;
  }
}

function loadVersionsFromStorage(storageKey: string, allVersions: string[]): Set<string> {
  if (typeof window === "undefined") {
    return new Set(allVersions);
  }

  try {
    const stored = readVersionsSnapshot(storageKey);
    if (stored) {
      const parsed = JSON.parse(stored) as string[];
      const validVersions = parsed.filter((v) => allVersions.includes(v));
      if (parsed.length === 0) {
        return new Set();
      }
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
    localStorage.setItem(getStorageKey(storageKey), JSON.stringify([...versions]));
    window.dispatchEvent(new CustomEvent(STORAGE_EVENT_NAME, { detail: { storageKey } }));
  } catch {
    // Ignore storage errors
  }
}

function sanitizeVersions(versions: Iterable<string>, allVersions: string[]): Set<string> {
  const valid = [...versions].filter((v) => allVersions.includes(v));
  return new Set(valid);
}

function subscribeToVersionChanges(storageKey: string, onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === getStorageKey(storageKey)) {
      onStoreChange();
    }
  };

  const handleCustomEvent = (event: Event) => {
    const detail = (event as CustomEvent<{ storageKey?: string }>).detail;
    if (detail?.storageKey === storageKey) {
      onStoreChange();
    }
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(STORAGE_EVENT_NAME, handleCustomEvent);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(STORAGE_EVENT_NAME, handleCustomEvent);
  };
}

export function usePipelineVersions(
  storageKey: string,
  allVersions: string[],
): UsePipelineVersionsReturn {
  const snapshot = useSyncExternalStore(
    (onStoreChange) => subscribeToVersionChanges(storageKey, onStoreChange),
    () => readVersionsSnapshot(storageKey),
    () => null,
  );

  const sanitizedSelectedVersions = useMemo(
    () => {
      if (snapshot == null) {
        return new Set(allVersions);
      }

      try {
        const parsed = JSON.parse(snapshot) as string[];
        if (parsed.length === 0) {
          return new Set<string>();
        }

        return sanitizeVersions(parsed, allVersions);
      } catch {
        return loadVersionsFromStorage(storageKey, allVersions);
      }
    },
    [allVersions, snapshot, storageKey],
  );

  const toggleVersion = useCallback((version: string) => {
    const next = new Set(sanitizedSelectedVersions);
    if (next.has(version)) {
      next.delete(version);
    } else {
      next.add(version);
    }

    saveVersionsToStorage(storageKey, sanitizeVersions(next, allVersions));
  }, [allVersions, sanitizedSelectedVersions, storageKey]);

  const selectAll = useCallback(() => {
    saveVersionsToStorage(storageKey, sanitizeVersions(allVersions, allVersions));
  }, [allVersions, storageKey]);

  const deselectAll = useCallback(() => {
    saveVersionsToStorage(storageKey, new Set<string>());
  }, [storageKey]);

  return {
    selectedVersions: sanitizedSelectedVersions,
    toggleVersion,
    selectAll,
    deselectAll,
  };
}

const STORAGE_KEY = "ucd-last-active-source";

export function getLastActiveSource(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setLastActiveSource(sourceId: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (sourceId == null) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, sourceId);
    }
  } catch {
    // Ignore storage errors
  }
}

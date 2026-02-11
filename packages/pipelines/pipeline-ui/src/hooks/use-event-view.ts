import { useCallback, useState } from "react";

export interface EventViewState {
  isJsonMode: boolean;
  selectedEventId: string | null;
  isDetailPanelOpen: boolean;
  expandedInlineIds: Set<string>;
}

export interface EventViewActions {
  toggleJsonMode: () => void;
  setJsonMode: (value: boolean) => void;
  selectEvent: (eventId: string | null) => void;
  openDetailPanel: (eventId: string) => void;
  closeDetailPanel: () => void;
  toggleInlineExpansion: (eventId: string) => void;
  isInlineExpanded: (eventId: string) => boolean;
}

export function useEventView(): EventViewState & EventViewActions {
  const [isJsonMode, setIsJsonMode] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("pipeline-events-json-mode");
      return stored === "true";
    }
    return false;
  });

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
  const [expandedInlineIds, setExpandedInlineIds] = useState<Set<string>>(() => new Set());

  const toggleJsonMode = useCallback(() => {
    setIsJsonMode((prev) => {
      const next = !prev;
      localStorage.setItem("pipeline-events-json-mode", String(next));
      return next;
    });
  }, []);

  const setJsonMode = useCallback((value: boolean) => {
    setIsJsonMode(value);
    localStorage.setItem("pipeline-events-json-mode", String(value));
  }, []);

  const selectEvent = useCallback((eventId: string | null) => {
    setSelectedEventId(eventId);
  }, []);

  const openDetailPanel = useCallback((eventId: string) => {
    setSelectedEventId(eventId);
    setIsDetailPanelOpen(true);
  }, []);

  const closeDetailPanel = useCallback(() => {
    setIsDetailPanelOpen(false);
    setSelectedEventId(null);
  }, []);

  const toggleInlineExpansion = useCallback((eventId: string) => {
    setExpandedInlineIds((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  }, []);

  const isInlineExpanded = useCallback((eventId: string) => {
    return expandedInlineIds.has(eventId);
  }, [expandedInlineIds]);

  return {
    isJsonMode,
    selectedEventId,
    isDetailPanelOpen,
    expandedInlineIds,
    toggleJsonMode,
    setJsonMode,
    selectEvent,
    openDetailPanel,
    closeDetailPanel,
    toggleInlineExpansion,
    isInlineExpanded,
  };
}

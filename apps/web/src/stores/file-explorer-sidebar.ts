import { create } from "zustand";

interface FileExplorerSidebarState {
  expandedPaths: Record<string, boolean>;
  filterText: string;
  setFilterText: (value: string) => void;
  toggleExpandedPath: (path: string, defaultExpanded: boolean) => void;
}

export const useFileExplorerSidebarStore = create<FileExplorerSidebarState>()((set) => ({
  expandedPaths: {},
  filterText: "",
  setFilterText: (value) => set({ filterText: value }),
  toggleExpandedPath: (path, defaultExpanded) => set((state) => {
    const currentOverride = state.expandedPaths[path];
    const isExpanded = currentOverride ?? defaultExpanded;
    const nextExpanded = !isExpanded;

    if (nextExpanded === defaultExpanded) {
      const expandedPaths = { ...state.expandedPaths };
      delete expandedPaths[path];
      return { expandedPaths };
    }

    return {
      expandedPaths: {
        ...state.expandedPaths,
        [path]: nextExpanded,
      },
    };
  }),
}));

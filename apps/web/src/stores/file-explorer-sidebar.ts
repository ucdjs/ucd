import { create } from "zustand";

interface FileExplorerSidebarState {
  expandedPaths: Record<string, true>;
  filterText: string;
  setFilterText: (value: string) => void;
  toggleExpandedPath: (path: string) => void;
}

export const useFileExplorerSidebarStore = create<FileExplorerSidebarState>()((set) => ({
  expandedPaths: {},
  filterText: "",
  setFilterText: (value) => set({ filterText: value }),
  toggleExpandedPath: (path) => set((state) => {
    if (state.expandedPaths[path]) {
      const expandedPaths = { ...state.expandedPaths };
      delete expandedPaths[path];
      return { expandedPaths };
    }

    return {
      expandedPaths: {
        ...state.expandedPaths,
        [path]: true,
      },
    };
  }),
}));

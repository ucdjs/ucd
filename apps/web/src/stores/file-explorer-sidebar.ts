import { create } from "zustand";

type DirectoryDisclosure = "open" | "closed";

interface FileExplorerSidebarState {
  sidebarQuery: string;
  disclosureByPath: Record<string, DirectoryDisclosure>;
  setSidebarQuery: (value: string) => void;
  toggleDirectoryOpen: (path: string, routeOpen: boolean) => void;
}

export const useFileExplorerSidebarStore = create<FileExplorerSidebarState>()((set) => ({
  sidebarQuery: "",
  disclosureByPath: {},
  setSidebarQuery: (value) => set({ sidebarQuery: value }),
  toggleDirectoryOpen: (path, routeOpen) => set((state) => {
    const currentOpen = state.disclosureByPath[path] === "open"
      ? true
      : state.disclosureByPath[path] === "closed"
        ? false
        : routeOpen;
    const nextOpen = !currentOpen;

    if (nextOpen === routeOpen) {
      if (!(path in state.disclosureByPath)) {
        return state;
      }

      const disclosureByPath = { ...state.disclosureByPath };
      delete disclosureByPath[path];
      return { disclosureByPath };
    }

    return {
      disclosureByPath: {
        ...state.disclosureByPath,
        [path]: nextOpen ? "open" : "closed",
      },
    };
  }),
}));

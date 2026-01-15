import type { TreeViewNode } from "reactive-vscode";
import type { TreeItem } from "vscode";
import { UNICODE_VERSION_METADATA } from "@unicode-utils/core";
import { computed, createSingletonComposable, ref, toRaw } from "reactive-vscode";
import { ThemeIcon, TreeItemCollapsibleState } from "vscode";
import { getFilesByVersion } from "../lib/files";
import { logger } from "../logger";
import { useUCDStore } from "./useUCDStore";

export interface UCDTreeItem extends TreeItem {
  __ucd?: {
    url: string;
    version: string;
    filePath?: string;
  };
}

export const useUCDExplorer = createSingletonComposable(() => {
  const store = useUCDStore();

  const childrenCache = ref<Map<string, TreeViewNode[]>>(new Map());
  const loadingPromises = ref<Map<string, Promise<TreeViewNode[]>>>(new Map());

  function refresh() {
    childrenCache.value.clear();
    loadingPromises.value.clear();
  }

  async function loadChildrenForVersion(version: string): Promise<TreeViewNode[]> {
    const cached = childrenCache.value.get(version);
    if (cached) {
      return cached;
    }

    // return existing promise if already loading (prevents duplicate requests)
    const existingPromise = loadingPromises.value.get(version);
    if (existingPromise) {
      return existingPromise;
    }

    // create new loading promise
    const loadingPromise = (async () => {
      try {
        const storeValue = toRaw(store.value);
        if (!storeValue) {
          throw new TypeError("UCD Store is not initialized");
        }

        const files = await getFilesByVersion(
          storeValue,
          version,
        );

        childrenCache.value.set(version, files);
        return files;
      } catch (error) {
        logger.error(`Failed to load files for version ${version}:`, error);
        return [];
      } finally {
        // clean up loading promise regardless of success/failure
        loadingPromises.value.delete(version);
      }
    })();

    // store the promise to prevent duplicate requests
    loadingPromises.value.set(version, loadingPromise);
    return loadingPromise;
  }

  const nodes = computed<TreeViewNode[]>(() =>
    UNICODE_VERSION_METADATA.map((metadata) => {
      const version = metadata.version;
      return {
        treeItem: {
          iconPath: new ThemeIcon("folder"),
          label: metadata.version + (metadata.type === "draft" ? " (Draft)" : ""),
          description: metadata.date ? `Released in ${metadata.date}` : "",
          tooltip: `Documentation: ${metadata.documentationUrl}\nUCD URL: ${metadata.url}`,
          collapsibleState: TreeItemCollapsibleState.Collapsed,
          contextValue: "ucd:version-folder",
          __ucd: {
            version: metadata.version,
            url: metadata.url,
          },
        } as UCDTreeItem,
        children: childrenCache.value.get(version) || [],
      };
    }),
  );

  return {
    nodes,
    loadChildrenForVersion,
    refresh,
  };
});

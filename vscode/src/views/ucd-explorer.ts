import type { UCDTreeItem } from "../composables/useUCDExplorer";
import { useTreeView } from "reactive-vscode";
import { useUCDExplorer } from "../composables/useUCDExplorer";
import { logger } from "../logger";

export function initializeUCDExplorerView() {
  const explorer = useUCDExplorer();

  const view = useTreeView("ucd:explorer", explorer.nodes, {
    showCollapseAll: true,
    async onDidExpandElement(event) {
      try {
        const { element } = event;
        const treeItem = typeof element.treeItem === "object" && "then" in element.treeItem
          ? await element.treeItem
          : element.treeItem;

        if (treeItem.contextValue === "ucd:version-folder") {
          const version = (treeItem as UCDTreeItem).__ucd?.version;
          if (version) {
            await explorer.loadChildrenForVersion(version);
          }
        }
      } catch (err) {
        logger.error("An error occurred while expanding entry in UCD Explorer", err);
      }
    },
  });

  return { view, explorer };
}

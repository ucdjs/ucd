import type { TreeViewNode } from "reactive-vscode";
import type { UCDTreeItem } from "../composables/useUCDExplorer";
import { executeCommand, useCommand } from "reactive-vscode";
import { Uri } from "vscode";
import * as Meta from "../generated/meta";
import { logger } from "../logger";

export function useOpenOnUnicodeCommand() {
  useCommand(Meta.commands.openOnUnicode, async (treeView: TreeViewNode) => {
    if (treeView == null) {
      logger.error("No entry provided to openOnUnicode command.");
      return;
    }

    if (typeof treeView !== "object" || !("treeItem" in treeView)) {
      logger.error("Invalid entry provided to openOnUnicode command.");
      return;
    }

    if (!treeView.treeItem || !(treeView.treeItem as UCDTreeItem).__ucd) {
      logger.error("Invalid entry provided to openOnUnicode command.");
      return;
    }

    const ucdItem = (treeView.treeItem as UCDTreeItem).__ucd;
    if (!ucdItem) {
      logger.error("UCD item is undefined or null.");
      return;
    }

    if (!ucdItem?.url) {
      logger.error("UCD item does not have a valid URL.");
      return;
    }

    executeCommand("vscode.open", Uri.parse(ucdItem.url));
  });
}

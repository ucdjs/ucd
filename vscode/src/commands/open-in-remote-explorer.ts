import type { TreeViewNode } from "reactive-vscode";
import type { UCDTreeItem } from "../composables/useUCDExplorer";
import { hasUCDFolderPath } from "@unicode-utils/core";
import { executeCommand, useCommand } from "reactive-vscode";
import { Uri } from "vscode";
import { config } from "../config";
import * as Meta from "../generated/meta";
import { logger } from "../logger";

export function useOpenInRemoteExplorerCommand() {
  useCommand(Meta.commands.openInRemoteExplorer, async (treeView: TreeViewNode) => {
    if (treeView == null) {
      logger.error("No entry provided to openInRemoteExplorer command.");
      return;
    }

    if (typeof treeView !== "object" || !("treeItem" in treeView)) {
      logger.error("Invalid entry provided to openOnUnicode command.");
      return;
    }

    if (!treeView.treeItem || !(treeView.treeItem as UCDTreeItem).__ucd) {
      logger.error("Invalid entry provided to openEntry command.");
      return;
    }

    const ucdItem = (treeView.treeItem as UCDTreeItem).__ucd;
    if (!ucdItem) {
      logger.error("UCD item is undefined or null.");
      return;
    }

    executeCommand("vscode.open", Uri.parse(`${config["frontend-url"]}/file-explorer/${ucdItem.version}/${hasUCDFolderPath(ucdItem.version) ? "ucd/" : ""}${ucdItem.filePath ?? ""}`));
  });
}

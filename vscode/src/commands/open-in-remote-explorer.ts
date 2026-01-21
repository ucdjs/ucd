import type { UCDTreeItem } from "../composables/useUCDExplorer";
import type { TreeViewNode } from "reactive-vscode";
import { hasUCDFolderPath } from "@unicode-utils/core";
import { useCommand } from "reactive-vscode";
import { commands, Uri } from "vscode";
import { config } from "../config";
import * as Meta from "../generated/meta";
import { logger } from "../logger";

export function useOpenInRemoteExplorerCommand() {
  useCommand(Meta.commands.openInRemoteExplorer, async (treeViewOrUri: Uri | TreeViewNode) => {
    if (treeViewOrUri == null) {
      logger.error("No entry provided to openInRemoteExplorer command.");
      return;
    }

    // If we get a string that is a valid URI, and its using the ucd scheme, open it in the remote explorer
    if (treeViewOrUri instanceof Uri) {
      if (treeViewOrUri.scheme !== "ucd") {
        logger.error("Invalid URI scheme provided to openInRemoteExplorer command.");
        return;
      }

      commands.executeCommand("vscode.open", Uri.parse(`${config["frontend-url"]}/file-explorer/${treeViewOrUri.path}`));
      return;
    }

    if (typeof treeViewOrUri !== "object" || !("treeItem" in treeViewOrUri)) {
      logger.error("Invalid entry provided to openInRemoteExplorer command.");
      return;
    }

    if (!treeViewOrUri.treeItem || !(treeViewOrUri.treeItem as UCDTreeItem).__ucd) {
      logger.error("Invalid entry provided to openInRemoteExplorer command.");
      return;
    }

    const ucdItem = (treeViewOrUri.treeItem as UCDTreeItem).__ucd;
    if (!ucdItem) {
      logger.error("UCD item is undefined or null.");
      return;
    }

    commands.executeCommand("vscode.open", Uri.parse(`${config["frontend-url"]}/file-explorer/${ucdItem.version}/${hasUCDFolderPath(ucdItem.version) ? "ucd/" : ""}${ucdItem.filePath ?? ""}`));
  });
}

import type { TreeViewNode } from "reactive-vscode";
import type { UCDTreeItem } from "../composables/useUCDExplorer";
import { executeCommand, useCommand } from "reactive-vscode";
import { Uri } from "vscode";
import * as Meta from "../generated/meta";
import { logger } from "../logger";

export function useOpenOnUnicodeCommand() {
  useCommand(Meta.commands.openOnUnicode, async (treeViewOrUri: Uri | TreeViewNode) => {
    if (treeViewOrUri == null) {
      logger.error("No entry provided to openOnUnicode command.");
      return;
    }

    // If we get a string that is a valid URI, and its using the ucd scheme, open it in the remote explorer
    if (treeViewOrUri instanceof Uri) {
      if (treeViewOrUri.scheme !== "ucd") {
        logger.error("Invalid URI scheme provided to openInRemoteExplorer command.");
        return;
      }

      // TODO: This would allow to traverse upwards, this should be blocked.
      executeCommand("vscode.open", Uri.parse(`https://unicode.org/Public/${treeViewOrUri.path}`));
      return;
    }

    if (typeof treeViewOrUri !== "object" || !("treeItem" in treeViewOrUri)) {
      logger.error("Invalid entry provided to openOnUnicode command.");
      return;
    }

    if (!treeViewOrUri.treeItem || !(treeViewOrUri.treeItem as UCDTreeItem).__ucd) {
      logger.error("Invalid entry provided to openOnUnicode command.");
      return;
    }

    const ucdItem = (treeViewOrUri.treeItem as UCDTreeItem).__ucd;
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

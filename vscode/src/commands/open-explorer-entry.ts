import type { TreeViewNode } from "reactive-vscode";
import type { UCDTreeItem } from "../composables/useUCDExplorer";
import { hasUCDFolderPath } from "@unicode-utils/core";
import { executeCommand, useCommand } from "reactive-vscode";
import { languages, Uri, window } from "vscode";
import * as Meta from "../generated/meta";
import { logger } from "../logger";

export function useOpenExplorerEntryCommand() {
  useCommand(Meta.commands.openExplorerEntry, async (versionOrTreeView: string | TreeViewNode, filePath?: string) => {
    if (versionOrTreeView == null) {
      logger.error("No entry provided to openEntry command.");
      return;
    }

    if (typeof versionOrTreeView === "object" && "treeItem" in versionOrTreeView) {
      const treeView = versionOrTreeView;

      if (!treeView.treeItem || !(treeView.treeItem as UCDTreeItem).__ucd) {
        logger.error("Invalid entry provided to openEntry command.");
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
      return;
    }

    const version = versionOrTreeView;
    if (!filePath) {
      logger.error("File path is required when version is provided as string.");
      return;
    }

    const textEditor = await window.showTextDocument(Uri.parse(`ucd:${version}/${hasUCDFolderPath(version) ? "ucd/" : ""}${filePath}`));
    // I can't figure out how to set the language of the text editor directly,
    // so we use the languages API to set the language for the document.
    // The only issue is that, this triggers a close event, and a open event...
    await languages.setTextDocumentLanguage(textEditor.document, "ucd");
  });
}

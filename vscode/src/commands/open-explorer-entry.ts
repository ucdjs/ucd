import type { UCDTreeItem } from "../composables/useUCDExplorer";
import type { TreeViewNode } from "reactive-vscode";
import { hasUCDFolderPath } from "@unicode-utils/core";
import { toRaw, useCommand } from "reactive-vscode";
import { commands, languages, Uri, window } from "vscode";
import { useUCDStore } from "../composables/useUCDStore";
import * as Meta from "../generated/meta";
import { showFilePicker, showVersionPicker } from "../lib/pickers";
import { logger } from "../logger";

async function openUCDFile(version: string, filePath: string): Promise<void> {
  const uri = Uri.parse(`ucd:${version}/${hasUCDFolderPath(version) ? "ucd/" : ""}${filePath}`);
  const textEditor = await window.showTextDocument(uri);
  // I can't figure out how to set the language of the text editor directly,
  // so we use the languages API to set the language for the document.
  // The only issue is that, this triggers a close event, and a open event...
  await languages.setTextDocumentLanguage(textEditor.document, "ucd");
}

export function useOpenExplorerEntryCommand() {
  const store = useUCDStore();

  useCommand(Meta.commands.openExplorerEntry, async (versionOrTreeView?: string | TreeViewNode, filePath?: string) => {
    if (versionOrTreeView == null) {
      const storeValue = toRaw(store.value);
      if (!storeValue) {
        logger.error("UCD Store is not initialized.");
        window.showErrorMessage("UCD Store is not initialized. Please check your configuration.");
        return;
      }

      const selectedVersion = await showVersionPicker();
      if (!selectedVersion) {
        return;
      }

      const selectedFile = await showFilePicker(storeValue, selectedVersion);
      if (!selectedFile) {
        return;
      }

      await openUCDFile(selectedVersion, selectedFile);
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

      commands.executeCommand("vscode.open", Uri.parse(ucdItem.url));
      return;
    }

    const version = versionOrTreeView;
    if (!filePath) {
      logger.error("File path is required when version is provided as string.");
      return;
    }

    await openUCDFile(version, filePath);
  });
}

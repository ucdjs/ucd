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

      // Sanitize path to prevent directory traversal attacks
      const rawPath = treeViewOrUri.path;

      // Normalize the path and check for traversal attempts
      // Use a simple approach: split, filter out dangerous segments, rejoin
      const segments = rawPath.split("/").filter((segment) => {
        // Block empty segments, current dir refs, and parent dir refs
        return segment !== "" && segment !== "." && segment !== "..";
      });

      // If no valid segments remain, block the request
      if (segments.length === 0) {
        logger.error("Invalid path provided to openOnUnicode command: path is empty or invalid.");
        return;
      }

      // Check if any segment still contains traversal patterns (encoded or otherwise)
      const hasTraversal = segments.some((segment) => {
        const decoded = decodeURIComponent(segment);
        return decoded === ".." || decoded === "." || decoded.includes("../") || decoded.includes("..\\");
      });

      if (hasTraversal) {
        logger.error("Invalid path provided to openOnUnicode command: path traversal detected.");
        return;
      }

      const sanitizedPath = segments.join("/");
      executeCommand("vscode.open", Uri.parse(`https://unicode.org/Public/${sanitizedPath}`));
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

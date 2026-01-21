import type { UCDTreeItem } from "../composables/useUCDExplorer";
import type { UnicodeFileTreeNodeWithoutLastModified } from "@ucdjs/schemas";
import type { UCDStore } from "@ucdjs/ucd-store";
import type { TreeViewNode } from "reactive-vscode";
import { hasUCDFolderPath } from "@unicode-utils/core";
import { ThemeIcon, TreeItemCollapsibleState } from "vscode";
import { logger } from "../logger";

function mapEntryToTreeNode(version: string, entry: UnicodeFileTreeNodeWithoutLastModified, parentPath?: string): TreeViewNode {
  if (entry == null) {
    throw new Error("Entry is null or undefined");
  }
  const hasChildren = ("children" in entry) && entry.children.length > 0;
  const currentPath = parentPath ? `${parentPath}/${entry.name}` : entry.name;
  const filePathForCommand = parentPath ? currentPath : entry.name;
  const isDirectory = entry.type === "directory";

  return {
    treeItem: {
      iconPath: isDirectory ? new ThemeIcon("folder") : new ThemeIcon("file"),
      label: entry.name,
      collapsibleState: isDirectory ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None,
      contextValue: isDirectory ? "ucd:explorer-folder" : "ucd:explorer-file",
      ...(isDirectory
        ? {}
        : {
            command: {
              title: "Open UCD Entry",
              command: "ucd.open-explorer-entry",
              arguments: [version, filePathForCommand],
              tooltip: "Open this file in UCD Viewer",
            },
          }),
      __ucd: {
        version,
        url: `https://unicode.org/Public/${version}/${hasUCDFolderPath(version) ? "ucd/" : ""}${filePathForCommand}`,
        filePath: filePathForCommand,
      },
    } as UCDTreeItem,
    children: hasChildren ? entry.children?.map((child) => mapEntryToTreeNode(version, child, currentPath)) : [],
  };
}

export async function getFilesByVersion(store: UCDStore, version: string): Promise<TreeViewNode[]> {
  try {
    const [data, err] = await store.files.tree(version);

    if (err) {
      throw err;
    }

    return data.map((entry) => mapEntryToTreeNode(
      version,
      entry,
    ));
  } catch (err) {
    logger.error(`Error fetching files for version ${version}:`, err);
    return [];
  }
}

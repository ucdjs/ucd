import type { UCDStore } from "@ucdjs/ucd-store";
import type { QuickPickItem } from "vscode";
import { flattenFilePaths } from "@ucdjs-internal/shared";
import { UNICODE_VERSION_METADATA } from "@unicode-utils/core";
import { window } from "vscode";
import { logger } from "../logger";

export interface VersionQuickPickItem extends QuickPickItem {
  version: string;
}

export interface FileQuickPickItem extends QuickPickItem {
  filePath: string;
}

export async function showVersionPicker(): Promise<string | undefined> {
  const items: VersionQuickPickItem[] = UNICODE_VERSION_METADATA.map((metadata) => ({
    label: metadata.version,
    description: metadata.type === "draft" ? "(Draft)" : undefined,
    detail: metadata.date ? `Released in ${metadata.date}` : undefined,
    version: metadata.version,
  }));

  const selected = await window.showQuickPick(items, {
    placeHolder: "Select a Unicode version",
    title: "UCD: Select Version",
  });

  return selected?.version;
}

export async function showFilePicker(store: UCDStore, version: string): Promise<string | undefined> {
  const quickPick = window.createQuickPick<FileQuickPickItem>();
  quickPick.placeholder = "Loading files...";
  quickPick.title = `UCD: Select File (${version})`;
  quickPick.busy = true;
  quickPick.show();

  try {
    const [data, err] = await store.files.tree(version);

    if (err) {
      throw err;
    }

    const flatPaths = flattenFilePaths(data);
    const items: FileQuickPickItem[] = flatPaths.map((filePath) => {
      const name = filePath.split("/").pop() ?? filePath;
      return {
        label: name,
        description: filePath !== name ? filePath : undefined,
        filePath,
      };
    });

    quickPick.items = items;
    quickPick.busy = false;
    quickPick.placeholder = "Select a file to open";

    return new Promise<string | undefined>((resolve) => {
      quickPick.onDidAccept(() => {
        const selected = quickPick.selectedItems[0];
        quickPick.hide();
        resolve(selected?.filePath);
      });

      quickPick.onDidHide(() => {
        quickPick.dispose();
        resolve(undefined);
      });
    });
  } catch (err) {
    quickPick.hide();
    quickPick.dispose();
    logger.error(`Failed to load files for version ${version}:`, err);
    window.showErrorMessage(`Failed to load files for version ${version}`);
    return undefined;
  }
}

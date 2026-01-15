import { defineExtension } from "reactive-vscode";
import { registerCommands } from "./commands";
import { useAutoDecorations } from "./composables/useAutoDecorations";
import { useUCDClient } from "./composables/useUCDClient";
import { useUCDContentProvider } from "./composables/useUCDContentProvider";
import { logger } from "./logger";
import { initializeUCDExplorerView } from "./views/ucd-explorer";
import { initializeInspectorView } from "./views/ucd-inspector";
import { initializeSelectionView } from "./views/ucd-selection";

const { activate, deactivate } = defineExtension(async () => {
  logger.info("Activating UCD Explorer extension...");
  initializeUCDExplorerView();
  initializeInspectorView();
  initializeSelectionView();

  useUCDClient();
  registerCommands();
  useUCDContentProvider();
  useAutoDecorations();

  logger.info("UCD Explorer extension activated successfully.");
});

export { activate, deactivate };

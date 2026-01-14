import { defineExtension } from "reactive-vscode";
import { registerCommands } from "./commands";
import { useUCDClient } from "./composables/useUCDClient";
import { useUCDContentProvider } from "./composables/useUCDContentProvider";
import { logger } from "./logger";
import { initializeUCDExplorerView } from "./views/ucd-explorer";
import { initializeInspectorView } from "./views/ucd-inspector";

const { activate, deactivate } = defineExtension(async () => {
  logger.info("Activating UCD Explorer extension...");
  initializeUCDExplorerView();
  initializeInspectorView();

  useUCDClient();
  registerCommands();
  useUCDContentProvider();

  logger.info("UCD Explorer extension activated successfully.");
});

export { activate, deactivate };

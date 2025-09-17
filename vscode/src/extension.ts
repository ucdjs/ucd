import { defineExtension } from "reactive-vscode";
import { registerCommands } from "./commands";
import { useUCDContentProvider } from "./composables/useUCDContentProvider";
import { logger } from "./logger";
import { initializeUCDExplorerView } from "./views/ucd-explorer";

const { activate, deactivate } = defineExtension(async () => {
  logger.info("Activating UCD Explorer extension...");
  initializeUCDExplorerView();

  registerCommands();
  useUCDContentProvider();

  logger.info("UCD Explorer extension activated successfully.");
});

export { activate, deactivate };

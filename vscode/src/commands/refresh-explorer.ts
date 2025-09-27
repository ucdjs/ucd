import { useCommand } from "reactive-vscode";
import { useUCDExplorer } from "../composables/useUCDExplorer";
import * as Meta from "../generated/meta";
import { logger } from "../logger";

export function useRefreshExplorerCommand() {
  useCommand(Meta.commands.refreshExplorer, async () => {
    const explorer = useUCDExplorer();

    if (!explorer) {
      logger.error("UCD Explorer is not initialized.");
      return;
    }

    explorer.refresh();

    logger.info("UCD Explorer refreshed successfully.");
  });
}

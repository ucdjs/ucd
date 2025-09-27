import { useBrowseUcdFilesCommand } from "./browse-ucd-files";
import { useOpenEntryCommand } from "./open-entry";
import { useRefreshExplorerCommand } from "./refresh-explorer";
import { useVisualizeFileCommand } from "./visualize-file";

export function registerCommands() {
  useBrowseUcdFilesCommand();
  useRefreshExplorerCommand();
  useVisualizeFileCommand();
  useOpenEntryCommand();
}

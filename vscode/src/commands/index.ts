import { useBrowseUcdFilesCommand } from "./browse-ucd-files";
import { useOpenExplorerEntryCommand } from "./open-explorer-entry";
import { useOpenInRemoteExplorerCommand } from "./open-in-remote-explorer";
import { useOpenOnUnicodeCommand } from "./open-on-unicode";
import { useRefreshExplorerCommand } from "./refresh-explorer";
import { useVisualizeFileCommand } from "./visualize-file";

export function registerCommands() {
  useBrowseUcdFilesCommand();
  useRefreshExplorerCommand();
  useVisualizeFileCommand();
  useOpenInRemoteExplorerCommand();
  useOpenOnUnicodeCommand();
  useOpenExplorerEntryCommand();
}

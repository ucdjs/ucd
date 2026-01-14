import { useBrowseUcdFilesCommand } from "./browse-ucd-files";
import { useGenerateOverrideCommand } from "./generate-override";
import { useOpenExplorerEntryCommand } from "./open-explorer-entry";
import { useOpenInRemoteExplorerCommand } from "./open-in-remote-explorer";
import { useOpenOnUnicodeCommand } from "./open-on-unicode";
import { useRefreshExplorerCommand } from "./refresh-explorer";
import { useInspectFileCommand } from "./inspect-file";

export function registerCommands() {
  useBrowseUcdFilesCommand();
  useRefreshExplorerCommand();
  useInspectFileCommand();
  useOpenInRemoteExplorerCommand();
  useOpenOnUnicodeCommand();
  useOpenExplorerEntryCommand();
  useGenerateOverrideCommand();
}

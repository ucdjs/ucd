import { executeCommand, useCommand } from "reactive-vscode";
import * as Meta from "../generated/meta";

export function useBrowseUcdFilesCommand() {
  useCommand(Meta.commands.browseUcdFiles, async () => {
    executeCommand("ucd:explorer.focus");
  });
}

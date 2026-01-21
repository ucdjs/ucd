import { useCommand } from "reactive-vscode";
import * as Meta from "../generated/meta";
import { commands } from "vscode";

export function useBrowseUcdFilesCommand() {
  useCommand(Meta.commands.browseUcdFiles, async () => {
    commands.executeCommand("ucd:explorer.focus");
  });
}

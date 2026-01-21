import { useCommand } from "reactive-vscode";
import { commands } from "vscode";
import * as Meta from "../generated/meta";

export function useBrowseUcdFilesCommand() {
  useCommand(Meta.commands.browseUcdFiles, async () => {
    commands.executeCommand("ucd:explorer.focus");
  });
}

import { useCommand } from "reactive-vscode";
import { window } from "vscode";
import * as Meta from "../generated/meta";

export function useVisualizeFileCommand() {
  useCommand(Meta.commands.visualizeFile, () => {
    window.showErrorMessage("This command is not implemented yet.");
  });
}

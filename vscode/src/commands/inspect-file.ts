import { useActiveTextEditor, useCommand } from "reactive-vscode";
import { commands as vscodeCommands, window } from "vscode";
import { useInspectorView } from "../composables/useInspectorView";
import { commands } from "../generated/meta";

export function useInspectFileCommand() {
  const activeEditor = useActiveTextEditor();
  const inspector = useInspectorView();

  useCommand(commands.inspectFile, async () => {
    const editor = activeEditor.value;

    if (!editor) {
      window.showErrorMessage("No active editor found");
      return;
    }

    const document = editor.document;
    const fileName = document.fileName.split("/").pop() ?? "Unknown File";
    const content = document.getText();

    inspector.inspectFile(fileName, content);

    await vscodeCommands.executeCommand("ucd:inspector.focus");
  });
}

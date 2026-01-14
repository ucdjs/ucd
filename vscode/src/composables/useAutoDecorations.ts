import { useActiveTextEditor, useDocumentText, watchEffect } from "reactive-vscode";
import { applyDecorations, clearDecorations } from "../lib/decorations";

export function useAutoDecorations() {
  const editor = useActiveTextEditor();
  const documentText = useDocumentText(() => editor.value?.document);

  watchEffect(() => {
    const currentEditor = editor.value;
    if (!currentEditor) return;

    const doc = currentEditor.document;
    const isUcdFile = doc.uri.scheme === "ucd"
      || doc.languageId === "ucd"
      || doc.fileName.endsWith(".txt");

    if (isUcdFile && documentText.value) {
      applyDecorations(currentEditor);
    } else {
      clearDecorations(currentEditor);
    }
  });
}

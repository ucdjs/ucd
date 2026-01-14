import type { TextEditor } from "vscode";
import type { HeadingOverride, ParserOverride, Position } from "../lib/override-schema";
import { computed, createSingletonComposable, ref } from "reactive-vscode";
import { window } from "vscode";
import { createParserOverride, isValidPosition, serializeOverride } from "../lib/override-schema";

export type SelectionMode = "idle" | "selecting" | "confirmed";

const headingHighlightDecoration = window.createTextEditorDecorationType({
  backgroundColor: "rgba(255, 213, 79, 0.3)",
  isWholeLine: true,
});

const selectionStartDecoration = window.createTextEditorDecorationType({
  backgroundColor: "rgba(76, 175, 80, 0.4)",
  isWholeLine: true,
  before: {
    contentText: "▶ START",
    color: "rgba(76, 175, 80, 1)",
    fontWeight: "bold",
    margin: "0 8px 0 0",
  },
});

const selectionEndDecoration = window.createTextEditorDecorationType({
  backgroundColor: "rgba(244, 67, 54, 0.4)",
  isWholeLine: true,
  before: {
    contentText: "◼ END",
    color: "rgba(244, 67, 54, 1)",
    fontWeight: "bold",
    margin: "0 8px 0 0",
  },
});

export const useOverrideGenerator = createSingletonComposable(() => {
  const mode = ref<SelectionMode>("idle");
  const selectionStart = ref<number | null>(null);
  const selectionEnd = ref<number | null>(null);
  const fileName = ref<string | null>(null);
  const unicodeVersion = ref<string | null>(null);
  const activeEditor = ref<TextEditor | null>(null);

  const currentPosition = computed<Position | null>(() => {
    if (selectionStart.value === null || selectionEnd.value === null) {
      return null;
    }
    return {
      start: selectionStart.value,
      end: selectionEnd.value,
    };
  });

  const isValid = computed(() => {
    const pos = currentPosition.value;
    return pos !== null && isValidPosition(pos);
  });

  const currentOverride = computed<ParserOverride | null>(() => {
    if (!fileName.value || !unicodeVersion.value || !currentPosition.value) {
      return null;
    }

    const heading: HeadingOverride = {
      position: currentPosition.value,
    };

    return createParserOverride(fileName.value, unicodeVersion.value, heading);
  });

  const overrideJson = computed(() => {
    if (!currentOverride.value) return null;
    return serializeOverride(currentOverride.value);
  });

  function startSelection(
    editor: TextEditor,
    file: string,
    version: string,
    detectedStart: number,
    detectedEnd: number,
  ) {
    mode.value = "selecting";
    activeEditor.value = editor;
    fileName.value = file;
    unicodeVersion.value = version;
    selectionStart.value = detectedStart;
    selectionEnd.value = detectedEnd;

    updateDecorations();
  }

  function updateSelection(start: number, end: number) {
    if (mode.value !== "selecting") return;

    selectionStart.value = start;
    selectionEnd.value = end;

    updateDecorations();
  }

  function setStart(line: number) {
    if (mode.value !== "selecting") return;
    selectionStart.value = line;
    if (selectionEnd.value !== null && line > selectionEnd.value) {
      selectionEnd.value = line;
    }
    updateDecorations();
  }

  function setEnd(line: number) {
    if (mode.value !== "selecting") return;
    selectionEnd.value = line;
    if (selectionStart.value !== null && line < selectionStart.value) {
      selectionStart.value = line;
    }
    updateDecorations();
  }

  function confirm(): ParserOverride | null {
    if (!isValid.value || !currentOverride.value) {
      return null;
    }

    mode.value = "confirmed";
    clearDecorations();

    return currentOverride.value;
  }

  function cancel() {
    mode.value = "idle";
    selectionStart.value = null;
    selectionEnd.value = null;
    fileName.value = null;
    unicodeVersion.value = null;
    clearDecorations();
    activeEditor.value = null;
  }

  function updateDecorations() {
    const editor = activeEditor.value;
    if (!editor) return;

    const start = selectionStart.value;
    const end = selectionEnd.value;

    if (start === null || end === null) {
      clearDecorations();
      return;
    }

    const document = editor.document;

    const highlightRanges = [];
    for (let i = start; i <= end; i++) {
      if (i < document.lineCount) {
        highlightRanges.push(document.lineAt(i).range);
      }
    }
    editor.setDecorations(headingHighlightDecoration, highlightRanges);

    if (start < document.lineCount) {
      editor.setDecorations(selectionStartDecoration, [document.lineAt(start).range]);
    }

    if (end < document.lineCount && end !== start) {
      editor.setDecorations(selectionEndDecoration, [document.lineAt(end).range]);
    } else if (end === start) {
      editor.setDecorations(selectionEndDecoration, []);
    }
  }

  function clearDecorations() {
    const editor = activeEditor.value;
    if (!editor) return;

    editor.setDecorations(headingHighlightDecoration, []);
    editor.setDecorations(selectionStartDecoration, []);
    editor.setDecorations(selectionEndDecoration, []);
  }

  return {
    mode,
    selectionStart,
    selectionEnd,
    fileName,
    unicodeVersion,
    currentPosition,
    isValid,
    currentOverride,
    overrideJson,
    startSelection,
    updateSelection,
    setStart,
    setEnd,
    confirm,
    cancel,
  };
});

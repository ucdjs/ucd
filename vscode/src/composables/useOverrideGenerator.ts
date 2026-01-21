import type { Disposable, TextEditor, TextEditorSelectionChangeEvent } from "vscode";
import type { HeadingOverride, ParserOverride, Position } from "../lib/override-schema";
import { computed, defineService, ref } from "reactive-vscode";
import { window } from "vscode";
import { createParserOverride, isValidPosition, serializeOverride } from "../lib/override-schema";

export type SelectionMode = "idle" | "selecting";
export type ClickMode = "set-start" | "set-end";

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

export const useOverrideGenerator = defineService(() => {
  const mode = ref<SelectionMode>("idle");
  const clickMode = ref<ClickMode>("set-start");
  const selectionStart = ref<number | null>(null);
  const selectionEnd = ref<number | null>(null);
  const fileName = ref<string | null>(null);
  const unicodeVersion = ref<string | null>(null);
  const activeEditor = ref<TextEditor | null>(null);

  let selectionChangeDisposable: Disposable | null = null;

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

  function onSelectionChange(event: TextEditorSelectionChangeEvent) {
    if (mode.value !== "selecting") return;
    if (event.textEditor !== activeEditor.value) return;

    const selection = event.selections[0];
    if (!selection) return;

    const clickedLine = selection.active.line;

    if (clickMode.value === "set-start") {
      selectionStart.value = clickedLine;
      if (selectionEnd.value !== null && clickedLine > selectionEnd.value) {
        selectionEnd.value = clickedLine;
      }
      clickMode.value = "set-end";
    } else {
      selectionEnd.value = clickedLine;
      if (selectionStart.value !== null && clickedLine < selectionStart.value) {
        selectionStart.value = clickedLine;
      }
      clickMode.value = "set-start";
    }

    updateDecorations();
  }

  function startSelection(
    editor: TextEditor,
    file: string,
    version: string,
    detectedStart: number,
    detectedEnd: number,
  ) {
    if (selectionChangeDisposable) {
      selectionChangeDisposable.dispose();
    }

    mode.value = "selecting";
    clickMode.value = "set-start";
    activeEditor.value = editor;
    fileName.value = file;
    unicodeVersion.value = version;
    selectionStart.value = detectedStart;
    selectionEnd.value = detectedEnd;

    selectionChangeDisposable = window.onDidChangeTextEditorSelection(onSelectionChange);

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

    const result = currentOverride.value;
    cleanup();
    return result;
  }

  function cancel() {
    cleanup();
  }

  function cleanup() {
    mode.value = "idle";
    selectionStart.value = null;
    selectionEnd.value = null;
    fileName.value = null;
    unicodeVersion.value = null;
    clearDecorations();
    activeEditor.value = null;

    if (selectionChangeDisposable) {
      selectionChangeDisposable.dispose();
      selectionChangeDisposable = null;
    }
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
    const actualStart = Math.min(start, end);
    const actualEnd = Math.max(start, end);

    const highlightRanges = [];
    for (let i = actualStart; i <= actualEnd; i++) {
      if (i < document.lineCount) {
        highlightRanges.push(document.lineAt(i).range);
      }
    }
    editor.setDecorations(headingHighlightDecoration, highlightRanges);

    if (actualStart < document.lineCount) {
      editor.setDecorations(selectionStartDecoration, [document.lineAt(actualStart).range]);
    }

    if (actualEnd < document.lineCount && actualEnd !== actualStart) {
      editor.setDecorations(selectionEndDecoration, [document.lineAt(actualEnd).range]);
    } else if (actualEnd === actualStart) {
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
    clickMode,
    selectionStart,
    selectionEnd,
    fileName,
    unicodeVersion,
    currentPosition,
    isValid,
    currentOverride,
    overrideJson,
    startSelection,
    setStart,
    setEnd,
    confirm,
    cancel,
    updateDecorations,
  };
});

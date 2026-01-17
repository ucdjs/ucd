import type { Disposable, TextEditor, TextEditorDecorationType, TextEditorSelectionChangeEvent } from "vscode";
import type { AnnotationsOverride, HeadingOverride, ParserOverride, SectionId, SectionState } from "../lib/override-schema";
import { computed, createSingletonComposable, ref } from "reactive-vscode";
import { window } from "vscode";
import {
  createInitialSectionStates,
  createParserOverride,
  getSectionDefinition,
  isSectionSelectionValid,
  SECTION_DEFINITIONS,
  serializeOverride,
} from "../lib/override-schema";

export type SelectionMode = "idle" | "selecting";
export type ClickMode = "set-start" | "set-end";

const decorationCache = new Map<string, {
  highlight: TextEditorDecorationType;
  start: TextEditorDecorationType;
  end: TextEditorDecorationType;
  line: TextEditorDecorationType;
}>();

function getDecorationsForSection(sectionId: SectionId) {
  const cached = decorationCache.get(sectionId);
  if (cached) {
    return cached;
  }

  const definition = getSectionDefinition(sectionId);
  if (!definition) {
    throw new Error(`Unknown section: ${sectionId}`);
  }

  const decorations = {
    highlight: window.createTextEditorDecorationType({
      backgroundColor: definition.highlightColor,
      isWholeLine: true,
    }),
    start: window.createTextEditorDecorationType({
      backgroundColor: definition.markerColor,
      isWholeLine: true,
      before: {
        contentText: "▶ START",
        color: definition.markerColor,
        fontWeight: "bold",
        margin: "0 8px 0 0",
      },
    }),
    end: window.createTextEditorDecorationType({
      backgroundColor: definition.markerColor,
      isWholeLine: true,
      before: {
        contentText: "◼ END",
        color: definition.markerColor,
        fontWeight: "bold",
        margin: "0 8px 0 0",
      },
    }),
    line: window.createTextEditorDecorationType({
      backgroundColor: definition.highlightColor,
      isWholeLine: true,
      before: {
        contentText: "●",
        color: definition.markerColor,
        fontWeight: "bold",
        margin: "0 8px 0 0",
      },
    }),
  };

  decorationCache.set(sectionId, decorations);
  return decorations;
}

export const useOverrideGenerator = createSingletonComposable(() => {
  const mode = ref<SelectionMode>("idle");
  const clickMode = ref<ClickMode>("set-start");
  const fileName = ref<string | null>(null);
  const unicodeVersion = ref<string | null>(null);
  const activeEditor = ref<TextEditor | null>(null);

  const sections = ref<SectionState[]>([]);
  const activeSectionId = ref<SectionId | null>(null);

  let selectionChangeDisposable: Disposable | null = null;

  const activeSection = computed(() => {
    if (!activeSectionId.value) return null;
    return sections.value.find((s) => s.id === activeSectionId.value) ?? null;
  });

  const activeSectionDefinition = computed(() => {
    if (!activeSectionId.value) return null;
    return getSectionDefinition(activeSectionId.value) ?? null;
  });

  const pendingSections = computed(() => {
    return sections.value.filter((s) => s.status === "pending");
  });

  const doneSections = computed(() => {
    return sections.value.filter((s) => s.status === "done");
  });

  const allSectionsDone = computed(() => {
    return sections.value.length > 0 && sections.value.every((s) => s.status === "done");
  });

  const currentOverride = computed<ParserOverride | null>(() => {
    if (!fileName.value || !unicodeVersion.value) {
      return null;
    }

    const headingState = sections.value.find((s) => s.id === "heading");
    let heading: HeadingOverride | undefined;

    if (headingState?.status === "done" && headingState.range) {
      heading = { position: headingState.range };
    }

    const annotationsState = sections.value.find((s) => s.id === "annotations");
    let annotations: AnnotationsOverride | undefined;

    if (annotationsState?.status === "done" && annotationsState.lines.length > 0) {
      annotations = { lines: [...annotationsState.lines] };
    }

    const override: ParserOverride = {
      version: 1,
      fileName: fileName.value,
      unicodeVersion: unicodeVersion.value,
    };

    if (heading) {
      override.heading = heading;
    }

    if (annotations) {
      override.annotations = annotations;
    }

    return override;
  });

  const overrideJson = computed(() => {
    if (!currentOverride.value) return null;
    return serializeOverride(currentOverride.value);
  });

  function onSelectionChange(event: TextEditorSelectionChangeEvent) {
    if (mode.value !== "selecting") return;
    if (event.textEditor !== activeEditor.value) return;
    if (!activeSectionId.value) return;

    const selection = event.selections[0];
    if (!selection) return;

    const clickedLine = selection.active.line;
    const section = activeSection.value;
    const definition = activeSectionDefinition.value;

    if (!section || !definition) return;

    if (definition.mode === "range") {
      handleRangeClick(section, clickedLine);
    } else {
      handleLineClick(section, clickedLine);
    }

    updateDecorations();
  }

  function handleRangeClick(section: SectionState, clickedLine: number) {
    if (clickMode.value === "set-start") {
      const currentEnd = section.range?.end ?? clickedLine;
      section.range = {
        start: clickedLine,
        end: Math.max(clickedLine, currentEnd),
      };
      clickMode.value = "set-end";
    } else {
      const currentStart = section.range?.start ?? clickedLine;
      section.range = {
        start: Math.min(currentStart, clickedLine),
        end: clickedLine,
      };
      clickMode.value = "set-start";
    }
  }

  function handleLineClick(section: SectionState, clickedLine: number) {
    const index = section.lines.indexOf(clickedLine);
    if (index === -1) {
      section.lines.push(clickedLine);
      section.lines.sort((a, b) => a - b);
    } else {
      section.lines.splice(index, 1);
    }
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

    sections.value = createInitialSectionStates();

    const firstSection = sections.value[0];
    if (firstSection) {
      firstSection.status = "active";
      activeSectionId.value = firstSection.id;

      const definition = getSectionDefinition(firstSection.id);
      if (definition?.mode === "range") {
        firstSection.range = { start: detectedStart, end: detectedEnd };
      }
    }

    selectionChangeDisposable = window.onDidChangeTextEditorSelection(onSelectionChange);

    updateDecorations();
  }

  function setActiveSection(sectionId: SectionId) {
    if (mode.value !== "selecting") return;

    const prevSection = activeSection.value;
    if (prevSection && prevSection.status === "active") {
      prevSection.status = "pending";
    }

    clearDecorations();

    const section = sections.value.find((s) => s.id === sectionId);
    if (section) {
      section.status = "active";
      activeSectionId.value = sectionId;
      clickMode.value = "set-start";
      updateDecorations();
    }
  }

  function confirmActiveSection(): boolean {
    const section = activeSection.value;
    const definition = activeSectionDefinition.value;

    if (!section || !definition) return false;

    if (!isSectionSelectionValid(section, definition)) {
      return false;
    }

    section.status = "done";
    clearDecorations();

    const nextPending = pendingSections.value[0];
    if (nextPending) {
      nextPending.status = "active";
      activeSectionId.value = nextPending.id;
      clickMode.value = "set-start";
      updateDecorations();
    } else {
      activeSectionId.value = null;
    }

    return true;
  }

  function skipActiveSection(): boolean {
    const section = activeSection.value;
    if (!section) return false;

    section.range = null;
    section.lines = [];
    section.status = "done";
    clearDecorations();

    const nextPending = pendingSections.value[0];
    if (nextPending) {
      nextPending.status = "active";
      activeSectionId.value = nextPending.id;
      clickMode.value = "set-start";
      updateDecorations();
    } else {
      activeSectionId.value = null;
    }

    return true;
  }

  function confirmAll(): ParserOverride | null {
    if (!allSectionsDone.value && activeSection.value) {
      const confirmed = confirmActiveSection();
      if (!confirmed) return null;
    }

    if (!allSectionsDone.value) return null;

    const result = currentOverride.value;
    cleanup();
    return result;
  }

  function cancel() {
    cleanup();
  }

  function cleanup() {
    mode.value = "idle";
    fileName.value = null;
    unicodeVersion.value = null;
    sections.value = [];
    activeSectionId.value = null;
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

    const section = activeSection.value;
    const definition = activeSectionDefinition.value;

    if (!section || !definition) {
      clearDecorations();
      return;
    }

    const document = editor.document;
    const decorations = getDecorationsForSection(section.id);

    if (definition.mode === "range" && section.range) {
      const { start, end } = section.range;
      const actualStart = Math.min(start, end);
      const actualEnd = Math.max(start, end);

      const highlightRanges = [];
      for (let i = actualStart; i <= actualEnd; i++) {
        if (i < document.lineCount) {
          highlightRanges.push(document.lineAt(i).range);
        }
      }
      editor.setDecorations(decorations.highlight, highlightRanges);

      if (actualStart < document.lineCount) {
        editor.setDecorations(decorations.start, [document.lineAt(actualStart).range]);
      }

      if (actualEnd < document.lineCount && actualEnd !== actualStart) {
        editor.setDecorations(decorations.end, [document.lineAt(actualEnd).range]);
      } else {
        editor.setDecorations(decorations.end, []);
      }

      editor.setDecorations(decorations.line, []);
    } else if (definition.mode === "lines") {
      const lineRanges = section.lines
        .filter((line) => line < document.lineCount)
        .map((line) => document.lineAt(line).range);

      editor.setDecorations(decorations.line, lineRanges);
      editor.setDecorations(decorations.highlight, []);
      editor.setDecorations(decorations.start, []);
      editor.setDecorations(decorations.end, []);
    }
  }

  function clearDecorations() {
    const editor = activeEditor.value;
    if (!editor) return;

    for (const sectionDef of SECTION_DEFINITIONS) {
      const decorations = decorationCache.get(sectionDef.id);
      if (decorations) {
        editor.setDecorations(decorations.highlight, []);
        editor.setDecorations(decorations.start, []);
        editor.setDecorations(decorations.end, []);
        editor.setDecorations(decorations.line, []);
      }
    }
  }

  return {
    mode,
    clickMode,
    fileName,
    unicodeVersion,
    sections,
    activeSectionId,
    activeSection,
    activeSectionDefinition,
    pendingSections,
    doneSections,
    allSectionsDone,
    currentOverride,
    overrideJson,
    startSelection,
    setActiveSection,
    confirmActiveSection,
    skipActiveSection,
    confirmAll,
    cancel,
    updateDecorations,
  };
});

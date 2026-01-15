import type { TextEditor } from "vscode";
import { parseDocument } from "./parsers";
import {
  codePointDecorationType,
  decorationTypes,
  fileDateDecorationType,
  fileNameDecorationType,
  fileVersionDecorationType,
  nameDecorationType,
  propertyDecorationType,
  rangeDecorationType,
  valueDecorationType,
} from "./types";

export {
  getCodePointHover,
  getDateHover,
  getFileNameHover,
  getNameHover,
  getPropertyHover,
  getRangeHover,
  getValueHover,
  getVersionHover,
} from "./hovers";

export {
  parseDataLine,
  parseDocument,
  parseMetadataLine,
} from "./parsers";

export type {
  DataLineMatch,
  MetadataMatch,
  ParsedDecorations,
} from "./parsers";

export {
  codePointDecorationType,
  decorationTypes,
  fileDateDecorationType,
  fileNameDecorationType,
  fileVersionDecorationType,
  nameDecorationType,
  propertyDecorationType,
  rangeDecorationType,
  valueDecorationType,
} from "./types";

export function applyDecorations(editor: TextEditor): void {
  const decorations = parseDocument(editor.document);

  editor.setDecorations(codePointDecorationType, decorations.codePoints);
  editor.setDecorations(rangeDecorationType, decorations.ranges);
  editor.setDecorations(propertyDecorationType, decorations.properties);
  editor.setDecorations(nameDecorationType, decorations.names);
  editor.setDecorations(valueDecorationType, decorations.values);
  editor.setDecorations(fileNameDecorationType, decorations.fileNames);
  editor.setDecorations(fileVersionDecorationType, decorations.fileVersions);
  editor.setDecorations(fileDateDecorationType, decorations.fileDates);
}

export function clearDecorations(editor: TextEditor): void {
  for (const decorationType of decorationTypes) {
    editor.setDecorations(decorationType, []);
  }
}

export function disposeDecorations(): void {
  for (const decorationType of decorationTypes) {
    decorationType.dispose();
  }
}

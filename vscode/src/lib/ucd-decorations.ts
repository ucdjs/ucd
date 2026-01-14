import type { DecorationOptions, TextEditor, TextEditorDecorationType } from "vscode";
import { window } from "vscode";

const decorationTypes: TextEditorDecorationType[] = [];

const commentDecorationType = window.createTextEditorDecorationType({
  color: "#608b4e",
  fontStyle: "italic",
});

const codePointDecorationType = window.createTextEditorDecorationType({
  color: "#569cd6",
  fontWeight: "bold",
});

const rangeDecorationType = window.createTextEditorDecorationType({
  color: "#c586c0",
  fontWeight: "bold",
});

const propertyDecorationType = window.createTextEditorDecorationType({
  color: "#dcdcaa",
});

const valueDecorationType = window.createTextEditorDecorationType({
  color: "#9cdcfe",
});

const nameDecorationType = window.createTextEditorDecorationType({
  color: "#ce9178",
});

decorationTypes.push(
  commentDecorationType,
  codePointDecorationType,
  rangeDecorationType,
  propertyDecorationType,
  valueDecorationType,
  nameDecorationType,
);

export function applyMockDecorations(editor: TextEditor): void {
  const document = editor.document;
  const text = document.getText();
  const lines = text.split("\n");

  const comments: DecorationOptions[] = [];
  const codePoints: DecorationOptions[] = [];
  const ranges: DecorationOptions[] = [];
  const properties: DecorationOptions[] = [];
  const values: DecorationOptions[] = [];
  const names: DecorationOptions[] = [];

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    if (line == null) continue;

    if (line.startsWith("#")) {
      comments.push({
        range: document.lineAt(lineIndex).range,
      });
      continue;
    }

    if (line.trim() === "") {
      continue;
    }

    const codePointMatch = line.match(/^([0-9A-F]{4,6})/i);
    if (codePointMatch?.[1]) {
      const startPos = document.positionAt(document.offsetAt(document.lineAt(lineIndex).range.start));
      const endPos = startPos.translate(0, codePointMatch[1].length);
      codePoints.push({
        range: document.lineAt(lineIndex).range.with(startPos, endPos),
      });
    }

    const rangeMatch = line.match(/([0-9A-F]{4,6})\.\.([0-9A-F]{4,6})/i);
    if (rangeMatch?.[0]) {
      const rangeStart = line.indexOf(rangeMatch[0]);
      const startPos = document.lineAt(lineIndex).range.start.translate(0, rangeStart);
      const endPos = startPos.translate(0, rangeMatch[0].length);
      ranges.push({
        range: document.lineAt(lineIndex).range.with(startPos, endPos),
      });
    }

    const parts = line.split(";");
    const firstPart = parts[0];
    if (parts.length >= 2 && firstPart != null) {
      let currentOffset = firstPart.length + 1;

      const secondPart = parts[1];
      if (secondPart != null) {
        const propValue = secondPart.trim();
        if (propValue.length > 0) {
          const propStart = line.indexOf(secondPart, currentOffset - 1);
          const startPos = document.lineAt(lineIndex).range.start.translate(0, propStart);
          const endPos = startPos.translate(0, secondPart.length);
          properties.push({
            range: document.lineAt(lineIndex).range.with(startPos, endPos),
          });
        }
        currentOffset += secondPart.length + 1;
      }

      const thirdPart = parts[2];
      if (thirdPart != null) {
        const nameValue = thirdPart.trim();
        if (nameValue.length > 0) {
          const nameStart = line.indexOf(thirdPart, currentOffset - 1);
          const startPos = document.lineAt(lineIndex).range.start.translate(0, nameStart);
          const endPos = startPos.translate(0, thirdPart.length);
          names.push({
            range: document.lineAt(lineIndex).range.with(startPos, endPos),
          });
        }
        currentOffset += thirdPart.length + 1;
      }

      for (let i = 3; i < parts.length; i++) {
        const part = parts[i];
        if (part == null) continue;
        const val = part.trim();
        if (val.length > 0) {
          const valStart = line.indexOf(part, currentOffset - 1);
          const startPos = document.lineAt(lineIndex).range.start.translate(0, valStart);
          const endPos = startPos.translate(0, part.length);
          values.push({
            range: document.lineAt(lineIndex).range.with(startPos, endPos),
          });
        }
        currentOffset += part.length + 1;
      }
    }
  }

  editor.setDecorations(commentDecorationType, comments);
  editor.setDecorations(codePointDecorationType, codePoints);
  editor.setDecorations(rangeDecorationType, ranges);
  editor.setDecorations(propertyDecorationType, properties);
  editor.setDecorations(nameDecorationType, names);
  editor.setDecorations(valueDecorationType, values);
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

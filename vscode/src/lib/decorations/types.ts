import type { TextEditorDecorationType } from "vscode";
import { window } from "vscode";

export const decorationTypes: TextEditorDecorationType[] = [];

export const codePointDecorationType = window.createTextEditorDecorationType({
  color: "#569cd6",
  fontWeight: "bold",
});

export const rangeDecorationType = window.createTextEditorDecorationType({
  color: "#c586c0",
  fontWeight: "bold",
});

export const propertyDecorationType = window.createTextEditorDecorationType({
  color: "#dcdcaa",
});

export const valueDecorationType = window.createTextEditorDecorationType({
  color: "#9cdcfe",
});

export const nameDecorationType = window.createTextEditorDecorationType({
  color: "#ce9178",
});

export const fileNameDecorationType = window.createTextEditorDecorationType({
  color: "#ce9178",
  fontWeight: "bold",
});

export const fileVersionDecorationType = window.createTextEditorDecorationType({
  color: "#569cd6",
  fontWeight: "bold",
});

export const fileDateDecorationType = window.createTextEditorDecorationType({
  color: "#b5cea8",
});

decorationTypes.push(
  codePointDecorationType,
  rangeDecorationType,
  propertyDecorationType,
  valueDecorationType,
  nameDecorationType,
  fileNameDecorationType,
  fileVersionDecorationType,
  fileDateDecorationType,
);

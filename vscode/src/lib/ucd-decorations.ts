import type { DecorationOptions, MarkdownString, TextEditor, TextEditorDecorationType } from "vscode";
import { MarkdownString as VscodeMarkdownString, window } from "vscode";

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

function createMarkdown(content: string): MarkdownString {
  const md = new VscodeMarkdownString(content);
  md.isTrusted = true;
  md.supportHtml = true;
  return md;
}

function getCodePointHover(codePoint: string): MarkdownString {
  const cp = Number.parseInt(codePoint, 16);
  const char = String.fromCodePoint(cp);
  const displayChar = cp >= 0x20 && cp <= 0x7E ? char : cp >= 0x100 ? char : "(control character)";

  return createMarkdown([
    `### Unicode Code Point`,
    ``,
    `| Property | Value |`,
    `|----------|-------|`,
    `| **Hex** | U+${codePoint.toUpperCase().padStart(4, "0")} |`,
    `| **Decimal** | ${cp} |`,
    `| **Character** | ${displayChar} |`,
    ``,
    `*Click to copy code point*`,
  ].join("\n"));
}

function getRangeHover(start: string, end: string): MarkdownString {
  const startCp = Number.parseInt(start, 16);
  const endCp = Number.parseInt(end, 16);
  const count = endCp - startCp + 1;

  return createMarkdown([
    `### Unicode Range`,
    ``,
    `| Property | Value |`,
    `|----------|-------|`,
    `| **Start** | U+${start.toUpperCase().padStart(4, "0")} |`,
    `| **End** | U+${end.toUpperCase().padStart(4, "0")} |`,
    `| **Count** | ${count.toLocaleString()} characters |`,
    ``,
    `*This range defines ${count.toLocaleString()} consecutive code points*`,
  ].join("\n"));
}

function getPropertyHover(property: string): MarkdownString {
  const prop = property.trim();

  const propertyDescriptions: Record<string, string> = {
    L: "Letter - Left-to-Right",
    R: "Letter - Right-to-Left",
    T: "Transparent - Non-spacing mark",
    D: "Dual Joining - Joins on both sides",
    C: "Join Causing - Causes joining",
    U: "Non Joining - Does not join",
    Lu: "Letter, Uppercase",
    Ll: "Letter, Lowercase",
    Lt: "Letter, Titlecase",
    Lm: "Letter, Modifier",
    Lo: "Letter, Other",
    Mn: "Mark, Nonspacing",
    Mc: "Mark, Spacing Combining",
    Me: "Mark, Enclosing",
    Nd: "Number, Decimal Digit",
    Nl: "Number, Letter",
    No: "Number, Other",
    Pc: "Punctuation, Connector",
    Pd: "Punctuation, Dash",
    Ps: "Punctuation, Open",
    Pe: "Punctuation, Close",
    Pi: "Punctuation, Initial quote",
    Pf: "Punctuation, Final quote",
    Po: "Punctuation, Other",
    Sm: "Symbol, Math",
    Sc: "Symbol, Currency",
    Sk: "Symbol, Modifier",
    So: "Symbol, Other",
    Zs: "Separator, Space",
    Zl: "Separator, Line",
    Zp: "Separator, Paragraph",
    Cc: "Other, Control",
    Cf: "Other, Format",
    Cs: "Other, Surrogate",
    Co: "Other, Private Use",
    Cn: "Other, Not Assigned",
  };

  const description = propertyDescriptions[prop] ?? "Unicode property value";

  return createMarkdown([
    `### Property Value`,
    ``,
    `**\`${prop}\`**`,
    ``,
    description,
    ``,
    `*This field specifies a Unicode property or category*`,
  ].join("\n"));
}

function getNameHover(name: string): MarkdownString {
  const trimmedName = name.trim();

  return createMarkdown([
    `### Character Name`,
    ``,
    `**${trimmedName}**`,
    ``,
    `The official Unicode character name. Names are unique and immutable once assigned.`,
    ``,
    `*Names follow the pattern: SCRIPT + DESCRIPTION*`,
  ].join("\n"));
}

function getValueHover(value: string, fieldIndex: number): MarkdownString {
  const trimmedValue = value.trim();

  const fieldNames = [
    "Code Point",
    "Property",
    "Name",
    "Additional Property",
    "Extended Property",
    "Mapping",
  ];

  const fieldName = fieldNames[fieldIndex] ?? `Field ${fieldIndex + 1}`;

  return createMarkdown([
    `### ${fieldName}`,
    ``,
    `**\`${trimmedValue}\`**`,
    ``,
    `Additional property or mapping value for this character entry.`,
  ].join("\n"));
}

function getCommentHover(comment: string): MarkdownString {
  const trimmedComment = comment.replace(/^#\s*/, "").trim();

  if (trimmedComment.startsWith("@")) {
    return createMarkdown([
      `### File Metadata`,
      ``,
      `\`${trimmedComment}\``,
      ``,
      `This is a file metadata directive specifying version or property information.`,
    ].join("\n"));
  }

  return createMarkdown([
    `### Comment`,
    ``,
    trimmedComment || "*Empty comment line*",
    ``,
    `*Comments provide context about the data below*`,
  ].join("\n"));
}

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
        hoverMessage: getCommentHover(line),
      });
      continue;
    }

    if (line.trim() === "") {
      continue;
    }

    const rangeMatch = line.match(/^([0-9A-F]{4,6})\.\.([0-9A-F]{4,6})/i);
    if (rangeMatch?.[0] && rangeMatch[1] && rangeMatch[2]) {
      const rangeStart = line.indexOf(rangeMatch[0]);
      const startPos = document.lineAt(lineIndex).range.start.translate(0, rangeStart);
      const endPos = startPos.translate(0, rangeMatch[0].length);
      ranges.push({
        range: document.lineAt(lineIndex).range.with(startPos, endPos),
        hoverMessage: getRangeHover(rangeMatch[1], rangeMatch[2]),
      });
    } else {
      const codePointMatch = line.match(/^([0-9A-F]{4,6})/i);
      if (codePointMatch?.[1]) {
        const startPos = document.positionAt(document.offsetAt(document.lineAt(lineIndex).range.start));
        const endPos = startPos.translate(0, codePointMatch[1].length);
        codePoints.push({
          range: document.lineAt(lineIndex).range.with(startPos, endPos),
          hoverMessage: getCodePointHover(codePointMatch[1]),
        });
      }
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
            hoverMessage: getPropertyHover(secondPart),
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
            hoverMessage: getNameHover(thirdPart),
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
            hoverMessage: getValueHover(part, i),
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

import type { MarkdownString } from "vscode";
import { MarkdownString as VscodeMarkdownString } from "vscode";

const PROPERTY_DESCRIPTIONS: Record<string, string> = {
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

const FIELD_NAMES = [
  "Code Point",
  "Property",
  "Name",
  "Additional Property",
  "Extended Property",
  "Mapping",
];

function createMarkdown(content: string): MarkdownString {
  const md = new VscodeMarkdownString(content);
  md.isTrusted = true;
  md.supportHtml = true;
  return md;
}

export function getCodePointHover(codePoint: string): MarkdownString {
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
  ].join("\n"));
}

export function getRangeHover(start: string, end: string): MarkdownString {
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
  ].join("\n"));
}

export function getPropertyHover(property: string): MarkdownString {
  const prop = property.trim();
  const description = PROPERTY_DESCRIPTIONS[prop] ?? "Unicode property value";

  return createMarkdown([
    `### Property Value`,
    ``,
    `**\`${prop}\`** — ${description}`,
  ].join("\n"));
}

export function getNameHover(name: string): MarkdownString {
  return createMarkdown([
    `### Character Name`,
    ``,
    `**${name.trim()}**`,
  ].join("\n"));
}

export function getValueHover(value: string, fieldIndex: number): MarkdownString {
  const fieldName = FIELD_NAMES[fieldIndex] ?? `Field ${fieldIndex + 1}`;

  return createMarkdown([
    `### ${fieldName}`,
    ``,
    `**\`${value.trim()}\`**`,
  ].join("\n"));
}

export function getFileNameHover(fileName: string): MarkdownString {
  return createMarkdown([
    `### File Name`,
    ``,
    `**${fileName}**`,
  ].join("\n"));
}

export function getVersionHover(version: string): MarkdownString {
  const majorMinor = version.split(".").slice(0, 2).join(".");

  return createMarkdown([
    `### Unicode Version ${version}`,
    ``,
    `| Resource | Link |`,
    `|----------|------|`,
    `| **Unicode.org** | [Unicode ${version}](https://unicode.org/versions/Unicode${version}/) |`,
    `| **Release Notes** | [What's New](https://unicode.org/versions/Unicode${version}/#Notable_Changes) |`,
    `| **UCD Files** | [Browse Files](https://unicode.org/Public/${version}/ucd/) |`,
    `| **ucdjs.dev** | [Explorer](https://ucdjs.dev/file-explorer/${version}) |`,
    ``,
    `*Released as part of Unicode ${majorMinor}*`,
  ].join("\n"));
}

export function getDateHover(date: string): MarkdownString {
  const formatted = new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return createMarkdown([
    `### File Date`,
    ``,
    `**${formatted}**`,
  ].join("\n"));
}

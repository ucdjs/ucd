import type { DecorationOptions, TextDocument } from "vscode";
import {
  getCodePointHover,
  getDateHover,
  getFileNameHover,
  getNameHover,
  getPropertyHover,
  getRangeHover,
  getValueHover,
  getVersionHover,
} from "./hovers";

export interface ParsedDecorations {
  codePoints: DecorationOptions[];
  ranges: DecorationOptions[];
  properties: DecorationOptions[];
  values: DecorationOptions[];
  names: DecorationOptions[];
  fileNames: DecorationOptions[];
  fileVersions: DecorationOptions[];
  fileDates: DecorationOptions[];
}

export interface MetadataMatch {
  fileName?: { text: string; start: number; end: number };
  version?: { text: string; start: number; end: number };
  date?: { text: string; start: number; end: number };
}

export function parseMetadataLine(line: string): MetadataMatch {
  const result: MetadataMatch = {};

  // Regex: SomeFile-16.0.0.txt
  const fileMatch = line.match(/#\s*([A-Z]\w*)-(\d+\.\d+\.\d+)(\.txt)/i);
  if (fileMatch?.[1] && fileMatch[2]) {
    const fullMatch = fileMatch[0];
    const matchStart = line.indexOf(fullMatch);
    const afterHash = matchStart + fullMatch.indexOf(fileMatch[1]);

    const fnStart = afterHash;
    const fnEnd = fnStart + fileMatch[1].length;
    result.fileName = { text: fileMatch[1], start: fnStart, end: fnEnd };

    const verStart = fnEnd + 1;
    const verEnd = verStart + fileMatch[2].length;
    result.version = { text: fileMatch[2], start: verStart, end: verEnd };
  }

  // Regex: YYYY-MM-DD
  const dateMatch = line.match(/(\d{4}-\d{2}-\d{2})/);
  if (dateMatch?.[1]) {
    const dateStart = line.indexOf(dateMatch[1]);
    const dateEnd = dateStart + dateMatch[1].length;
    result.date = { text: dateMatch[1], start: dateStart, end: dateEnd };
  }

  // Regex: Version X.Y.Z or vX.Y.Z
  if (!result.version) {
    const versionMatch = line.match(/(?:Version\s+|v)(\d+\.\d+\.\d+)/i);
    if (versionMatch?.[1]) {
      const versionNum = versionMatch[1];
      const versionNumStart = line.indexOf(versionNum, line.indexOf(versionMatch[0]));
      const versionNumEnd = versionNumStart + versionNum.length;
      result.version = { text: versionNum, start: versionNumStart, end: versionNumEnd };
    }
  }

  return result;
}

export interface DataLineMatch {
  codePoint?: { text: string; start: number; end: number };
  range?: { start: string; end: string; matchStart: number; matchEnd: number };
  fields: Array<{ text: string; start: number; end: number; index: number }>;
}

export function parseDataLine(line: string): DataLineMatch {
  const result: DataLineMatch = { fields: [] };

  // Regex: XXXX..YYYY (range)
  const rangeMatch = line.match(/^([0-9A-F]{4,6})\.\.([0-9A-F]{4,6})/i);
  if (rangeMatch?.[0] && rangeMatch[1] && rangeMatch[2]) {
    const rangeStart = line.indexOf(rangeMatch[0]);
    result.range = {
      start: rangeMatch[1],
      end: rangeMatch[2],
      matchStart: rangeStart,
      matchEnd: rangeStart + rangeMatch[0].length,
    };
  } else {
    // Regex: XXXX (single code point)
    const codePointMatch = line.match(/^([0-9A-F]{4,6})/i);
    if (codePointMatch?.[1]) {
      result.codePoint = {
        text: codePointMatch[1],
        start: 0,
        end: codePointMatch[1].length,
      };
    }
  }

  const parts = line.split(";");
  const firstPart = parts[0];
  if (parts.length >= 2 && firstPart != null) {
    let currentOffset = firstPart.length + 1;

    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      if (part == null) continue;

      const val = part.trim();
      if (val.length > 0) {
        const valStart = line.indexOf(part, currentOffset - 1);
        result.fields.push({
          text: part,
          start: valStart,
          end: valStart + part.length,
          index: i,
        });
      }
      currentOffset += part.length + 1;
    }
  }

  return result;
}

export function parseDocument(document: TextDocument): ParsedDecorations {
  const text = document.getText();
  const lines = text.split("\n");

  const decorations: ParsedDecorations = {
    codePoints: [],
    ranges: [],
    properties: [],
    values: [],
    names: [],
    fileNames: [],
    fileVersions: [],
    fileDates: [],
  };

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    if (line == null) continue;

    if (line.startsWith("#")) {
      if (lineIndex <= 5) {
        const metadata = parseMetadataLine(line);
        const lineRange = document.lineAt(lineIndex).range;

        if (metadata.fileName) {
          decorations.fileNames.push({
            range: lineRange.with(
              lineRange.start.translate(0, metadata.fileName.start),
              lineRange.start.translate(0, metadata.fileName.end),
            ),
            hoverMessage: getFileNameHover(metadata.fileName.text),
          });
        }

        if (metadata.version) {
          decorations.fileVersions.push({
            range: lineRange.with(
              lineRange.start.translate(0, metadata.version.start),
              lineRange.start.translate(0, metadata.version.end),
            ),
            hoverMessage: getVersionHover(metadata.version.text),
          });
        }

        if (metadata.date) {
          decorations.fileDates.push({
            range: lineRange.with(
              lineRange.start.translate(0, metadata.date.start),
              lineRange.start.translate(0, metadata.date.end),
            ),
            hoverMessage: getDateHover(metadata.date.text),
          });
        }
      }
      continue;
    }

    if (line.trim() === "") {
      continue;
    }

    const data = parseDataLine(line);
    const lineRange = document.lineAt(lineIndex).range;

    if (data.range) {
      decorations.ranges.push({
        range: lineRange.with(
          lineRange.start.translate(0, data.range.matchStart),
          lineRange.start.translate(0, data.range.matchEnd),
        ),
        hoverMessage: getRangeHover(data.range.start, data.range.end),
      });
    } else if (data.codePoint) {
      decorations.codePoints.push({
        range: lineRange.with(
          lineRange.start.translate(0, data.codePoint.start),
          lineRange.start.translate(0, data.codePoint.end),
        ),
        hoverMessage: getCodePointHover(data.codePoint.text),
      });
    }

    for (const field of data.fields) {
      const range = lineRange.with(
        lineRange.start.translate(0, field.start),
        lineRange.start.translate(0, field.end),
      );

      if (field.index === 1) {
        decorations.properties.push({
          range,
          hoverMessage: getPropertyHover(field.text),
        });
      } else if (field.index === 2) {
        decorations.names.push({
          range,
          hoverMessage: getNameHover(field.text),
        });
      } else {
        decorations.values.push({
          range,
          hoverMessage: getValueHover(field.text, field.index),
        });
      }
    }
  }

  return decorations;
}

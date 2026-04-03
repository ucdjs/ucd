import type { ParseContext, ParsedRow, ParserFn } from "@ucdjs/pipelines-core";
import { splitTwoFields } from "../utils/fields";

export interface MultiPropertyParserOptions {
  delimiter?: string;
  propertyMarker?: string;
  trimFields?: boolean;
}

function parseCodePointOrRange(field: string): { kind: ParsedRow["kind"]; start?: string; end?: string; codePoint?: string } {
  const trimmed = field.trim();
  if (trimmed.includes("..")) {
    const parts = trimmed.split("..");
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return { kind: "range", start: parts[0].trim(), end: parts[1].trim() };
    }
  }
  return { kind: "point", codePoint: trimmed };
}

export function createMultiPropertyParser(options: MultiPropertyParserOptions = {}): ParserFn {
  const { delimiter = ";", propertyMarker = "@", trimFields = true } = options;
  const propertyPrefix = `# ${propertyMarker}`;

  return async function* multiPropertyParser(ctx: ParseContext): AsyncIterable<ParsedRow> {
    let currentProperty: string | undefined;

    for await (const line of ctx.readLines()) {
      const trimmedLine = line.trim();

      if (trimmedLine.startsWith(propertyPrefix)) {
        const assignment = trimmedLine.slice(propertyPrefix.length);
        const separatorIndex = assignment.indexOf("=");

        if (separatorIndex > 0) {
          const value = assignment.slice(separatorIndex + 1).trim();
          if (value) {
            currentProperty = value;
          }
        }
        continue;
      }

      if (ctx.isComment(line) || trimmedLine === "") {
        continue;
      }

      const commentIndex = trimmedLine.indexOf("#");
      const dataLine = commentIndex >= 0 ? trimmedLine.slice(0, commentIndex) : trimmedLine;

      if (dataLine.trim() === "") {
        continue;
      }

      const fields = splitTwoFields(dataLine, delimiter);
      if (!fields) continue;

      const [rawCodePoint, rawValue] = fields;
      const codePointField = trimFields ? rawCodePoint.trim() : rawCodePoint;
      const valueField = trimFields ? rawValue.trim() : rawValue;

      const { kind, start, end, codePoint } = parseCodePointOrRange(codePointField);

      yield {
        sourceFile: ctx.file.path,
        kind,
        start,
        end,
        codePoint,
        property: currentProperty || valueField,
        value: valueField,
      };
    }
  };
}

export const multiPropertyParser = createMultiPropertyParser();

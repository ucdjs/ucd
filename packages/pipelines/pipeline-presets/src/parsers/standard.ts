import type { ParseContext, ParsedRow, ParserFn } from "@ucdjs/pipelines-core";
import { splitTwoFields } from "@ucdjs/pipelines-core";

export interface StandardParserOptions {
  delimiter?: string;
  trimFields?: boolean;
  skipEmpty?: boolean;
}

function parseCodePointOrRange(field: string): {
  kind: ParsedRow["kind"];
  start?: string;
  end?: string;
  codePoint?: string;
} {
  const trimmed = field.trim();
  if (trimmed.includes("..")) {
    const parts = trimmed.split("..");
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return { kind: "range", start: parts[0].trim(), end: parts[1].trim() };
    }
  }
  return { kind: "point", codePoint: trimmed };
}

export function createStandardParser(options: StandardParserOptions = {}): ParserFn {
  const { delimiter = ";", trimFields = true, skipEmpty = true } = options;

  return async function* standardParser(ctx: ParseContext): AsyncIterable<ParsedRow> {
    for await (const line of ctx.readLines()) {
      if (ctx.isComment(line)) {
        continue;
      }

      const trimmedLine = line.trim();
      if (skipEmpty && trimmedLine === "") {
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
        value: valueField,
      };
    }
  };
}

export const standardParser = createStandardParser();

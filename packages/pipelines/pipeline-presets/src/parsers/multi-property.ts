import type { ParseContext, ParsedRow, ParserFn } from "@ucdjs/pipelines-core";

export interface MultiPropertyParserOptions {
  delimiter?: string;
  propertyMarker?: string;
  trimFields?: boolean;
}

function parseCodePointOrRange(field: string): { kind: ParsedRow["kind"]; start?: string; end?: string; codePoint?: string } {
  const trimmed = field.trim();

  if (trimmed.includes("..")) {
    const [start, end] = trimmed.split("..");
    return { kind: "range", start: start.trim(), end: end.trim() };
  }

  return { kind: "point", codePoint: trimmed };
}

export function createMultiPropertyParser(options: MultiPropertyParserOptions = {}): ParserFn {
  const { delimiter = ";", propertyMarker = "@", trimFields = true } = options;

  return async function* multiPropertyParser(ctx: ParseContext): AsyncIterable<ParsedRow> {
    let currentProperty: string | undefined;

    for await (const line of ctx.readLines()) {
      const trimmedLine = line.trim();

      if (trimmedLine.startsWith(`# ${propertyMarker}`)) {
        const match = trimmedLine.match(/# @(\w+)=(\w+)/);
        if (match) {
          currentProperty = match[2];
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

      const fields = dataLine.split(delimiter);
      if (fields.length < 2) {
        continue;
      }

      const codePointField = trimFields ? fields[0].trim() : fields[0];
      const valueField = trimFields ? fields[1].trim() : fields[1];

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

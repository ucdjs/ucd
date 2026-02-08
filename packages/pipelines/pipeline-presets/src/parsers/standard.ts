import type { ParseContext, ParsedRow, ParserFn } from "@ucdjs/pipelines-core";

export interface StandardParserOptions {
  delimiter?: string;
  trimFields?: boolean;
  skipEmpty?: boolean;
}

function parseCodePointOrRange(field: string): { kind: ParsedRow["kind"]; start?: string; end?: string; codePoint?: string } {
  const trimmed = field.trim();

  if (trimmed.includes("..")) {
    const [start, end] = trimmed.split("..");
    return { kind: "range", start: start!.trim(), end: end!.trim() };
  }

  return { kind: "point", codePoint: trimmed };
}

export function createStandardParser(options: StandardParserOptions = {}): ParserFn {
  const { delimiter = ";", trimFields = true, skipEmpty = true } = options;

  return async function* standardParser(ctx: ParseContext): AsyncIterable<ParsedRow> {
    for await (const line of ctx.readLines()) {
      // eslint-disable-next-line no-console
      console.log(`Parsing line: ${line}`);
      if (ctx.isComment(line)) {
        console.error(`Skipping comment line: ${line}`);
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

      const fields = dataLine.split(delimiter);
      if (fields.length < 2) {
        continue;
      }

      const codePointField = trimFields ? fields[0]!.trim() : fields[0];
      const valueField = trimFields ? fields[1]!.trim() : fields[1];

      const { kind, start, end, codePoint } = parseCodePointOrRange(codePointField!);

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

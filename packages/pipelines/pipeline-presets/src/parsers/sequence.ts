import type { ParseContext, ParsedRow, ParserFn } from "@ucdjs/pipelines-core";

export interface SequenceParserOptions {
  delimiter?: string;
  sequenceDelimiter?: string;
  trimFields?: boolean;
}

export function createSequenceParser(options: SequenceParserOptions = {}): ParserFn {
  const { delimiter = ";", sequenceDelimiter = " ", trimFields = true } = options;

  return async function* sequenceParser(ctx: ParseContext): AsyncIterable<ParsedRow> {
    for await (const line of ctx.readLines()) {
      if (ctx.isComment(line)) {
        continue;
      }

      const trimmedLine = line.trim();
      if (trimmedLine === "") {
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

      const sequenceField = trimFields ? fields[0].trim() : fields[0];
      const valueField = trimFields ? fields[1].trim() : fields[1];

      const codePoints = sequenceField.split(sequenceDelimiter).filter(Boolean);

      if (codePoints.length === 0) {
        continue;
      }

      if (codePoints.length === 1) {
        yield {
          sourceFile: ctx.file.path,
          kind: "point",
          codePoint: codePoints[0],
          value: valueField,
        };
      } else {
        yield {
          sourceFile: ctx.file.path,
          kind: "sequence",
          sequence: codePoints,
          value: valueField,
        };
      }
    }
  };
}

export const sequenceParser = createSequenceParser();

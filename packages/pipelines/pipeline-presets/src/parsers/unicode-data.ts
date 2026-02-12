import type { ParseContext, ParsedRow, ParserFn } from "@ucdjs/pipelines-core";
import { splitMinFields } from "@ucdjs/pipelines-core";

export interface UnicodeDataMeta {
  characterName: string;
  generalCategory: string;
  canonicalCombiningClass: string;
  bidiClass: string;
  decompositionMapping: string;
  numericType: string;
  numericValue: string;
  bidiMirrored: string;
  unicode1Name: string;
  isoComment: string;
  simpleUppercaseMapping: string;
  simpleLowercaseMapping: string;
  simpleTitlecaseMapping: string;
}

export type UnicodeDataRow = ParsedRow & { meta: UnicodeDataMeta };

export const unicodeDataParser: ParserFn = async function* (
  ctx: ParseContext,
): AsyncIterable<ParsedRow> {
  let rangeStart: string | null = null;
  let rangeName: string | null = null;

  for await (const line of ctx.readLines()) {
    if (ctx.isComment(line)) {
      continue;
    }

    const trimmedLine = line.trim();
    if (trimmedLine === "") {
      continue;
    }

    const fields = splitMinFields(trimmedLine, ";", 14);
    if (!fields) continue;

    const codePoint = fields[0]?.trim() ?? "";
    const characterName = fields[1]?.trim() ?? "";
    const generalCategory = fields[2]?.trim() ?? "";

    if (characterName.endsWith(", First>")) {
      rangeStart = codePoint;
      rangeName = characterName.replace(", First>", "").replace("<", "");
      continue;
    }

    if (characterName.endsWith(", Last>") && rangeStart !== null) {
      const row: UnicodeDataRow = {
        sourceFile: ctx.file.path,
        kind: "range",
        start: rangeStart,
        end: codePoint,
        value: generalCategory,
        meta: {
          characterName: rangeName || "",
          generalCategory,
          canonicalCombiningClass: fields[3]?.trim() ?? "",
          bidiClass: fields[4]?.trim() ?? "",
          decompositionMapping: fields[5]?.trim() ?? "",
          numericType: fields[6]?.trim() ?? "",
          numericValue: fields[7]?.trim() ?? "",
          bidiMirrored: fields[9]?.trim() ?? "",
          unicode1Name: fields[10]?.trim() ?? "",
          isoComment: fields[11]?.trim() ?? "",
          simpleUppercaseMapping: fields[12]?.trim() ?? "",
          simpleLowercaseMapping: fields[13]?.trim() ?? "",
          simpleTitlecaseMapping: fields[14]?.trim() ?? "",
        },
      };

      rangeStart = null;
      rangeName = null;
      yield row;
      continue;
    }

    const row: UnicodeDataRow = {
      sourceFile: ctx.file.path,
      kind: "point",
      codePoint,
      value: generalCategory,
      meta: {
        characterName,
        generalCategory,
        canonicalCombiningClass: fields[3]?.trim() ?? "",
        bidiClass: fields[4]?.trim() ?? "",
        decompositionMapping: fields[5]?.trim() ?? "",
        numericType: fields[6]?.trim() ?? "",
        numericValue: fields[7]?.trim() ?? "",
        bidiMirrored: fields[9]?.trim() ?? "",
        unicode1Name: fields[10]?.trim() ?? "",
        isoComment: fields[11]?.trim() ?? "",
        simpleUppercaseMapping: fields[12]?.trim() ?? "",
        simpleLowercaseMapping: fields[13]?.trim() ?? "",
        simpleTitlecaseMapping: fields[14]?.trim() ?? "",
      },
    };

    yield row;
  }
};

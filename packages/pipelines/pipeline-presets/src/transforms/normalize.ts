import type { ParsedRow, PipelineTransformDefinition } from "@ucdjs/pipelines-core";
import { definePipelineTransform } from "@ucdjs/pipelines-core";

function normalizeHex(hex: string): string {
  return hex.toUpperCase().replace(/^0+/, "") || "0";
}

function padHex(hex: string, length: number = 4): string {
  return hex.toUpperCase().padStart(length, "0");
}

export const normalizeCodePoints = definePipelineTransform<ParsedRow, ParsedRow>({
  id: "normalize-code-points",
  async* fn(_ctx, rows) {
    for await (const row of rows) {
      const normalized = { ...row };

      if (normalized.codePoint) {
        normalized.codePoint = padHex(normalizeHex(normalized.codePoint));
      }

      if (normalized.start) {
        normalized.start = padHex(normalizeHex(normalized.start));
      }

      if (normalized.end) {
        normalized.end = padHex(normalizeHex(normalized.end));
      }

      if (normalized.sequence) {
        normalized.sequence = normalized.sequence.map((cp) => padHex(normalizeHex(cp)));
      }

      yield normalized;
    }
  },
});

export function createNormalizeTransform(padLength: number = 4): PipelineTransformDefinition<ParsedRow, ParsedRow> {
  return definePipelineTransform<ParsedRow, ParsedRow>({
    id: `normalize-code-points-${padLength}`,
    async* fn(_ctx, rows) {
      for await (const row of rows) {
        const normalized = { ...row };

        if (normalized.codePoint) {
          normalized.codePoint = padHex(normalizeHex(normalized.codePoint), padLength);
        }

        if (normalized.start) {
          normalized.start = padHex(normalizeHex(normalized.start), padLength);
        }

        if (normalized.end) {
          normalized.end = padHex(normalizeHex(normalized.end), padLength);
        }

        if (normalized.sequence) {
          normalized.sequence = normalized.sequence.map((cp) => padHex(normalizeHex(cp), padLength));
        }

        yield normalized;
      }
    },
  });
}

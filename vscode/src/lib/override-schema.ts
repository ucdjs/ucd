/**
 * Parser override schema types - mirrors unicode-utils/packages/parser/src/overrides/schema.ts
 */

/** Position using 0-indexed line numbers (both inclusive) */
export interface Position {
  start: number;
  end: number;
}

export interface HeadingOverride {
  allowEmptyLines?: boolean;
  allowMultipleBoundaries?: boolean;
  /** If specified, skips inference and uses explicit line range */
  position?: Position;
}

export interface ParserOverride {
  $schema?: string;
  version: 1;
  fileName: string;
  unicodeVersion: string;
  heading?: HeadingOverride;
}

export function isValidPosition(position: Position): boolean {
  return (
    Number.isInteger(position.start)
    && Number.isInteger(position.end)
    && position.start >= 0
    && position.end >= 0
    && position.end >= position.start
  );
}

export function createParserOverride(
  fileName: string,
  unicodeVersion: string,
  heading?: HeadingOverride,
): ParserOverride {
  return {
    version: 1,
    fileName,
    unicodeVersion,
    ...(heading && { heading }),
  };
}

export function serializeOverride(override: ParserOverride): string {
  return JSON.stringify(override, null, 2);
}

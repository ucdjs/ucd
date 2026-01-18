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

export interface AnnotationsOverride {
  lines?: number[];
}

export interface ParserOverride {
  $schema?: string;
  version: 1;
  fileName: string;
  unicodeVersion: string;
  heading?: HeadingOverride;
  annotations?: AnnotationsOverride;
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

export type SelectionMode = "range" | "lines";

export type SectionStatus = "pending" | "active" | "done";

export type SectionId = "heading" | "annotations";

export interface SectionDefinition {
  id: SectionId;
  label: string;
  description: string;
  mode: SelectionMode;
  highlightColor: string;
  markerColor: string;
}

export interface SectionState {
  id: SectionId;
  status: SectionStatus;
  range: Position | null;
  lines: number[];
}

export const SECTION_DEFINITIONS: readonly SectionDefinition[] = [
  {
    id: "heading",
    label: "Heading",
    description: "File header and metadata lines",
    mode: "range",
    highlightColor: "rgba(255, 213, 79, 0.3)",
    markerColor: "rgba(255, 213, 79, 0.8)",
  },
  {
    id: "annotations",
    label: "Annotations",
    description: "Annotation comment lines",
    mode: "lines",
    highlightColor: "rgba(100, 181, 246, 0.3)",
    markerColor: "rgba(100, 181, 246, 0.8)",
  },
] as const;

export function getSectionDefinition(id: SectionId): SectionDefinition | undefined {
  return SECTION_DEFINITIONS.find((def) => def.id === id);
}

export function createInitialSectionStates(): SectionState[] {
  return SECTION_DEFINITIONS.map((def) => ({
    id: def.id,
    status: "pending" as SectionStatus,
    range: null,
    lines: [],
  }));
}

export function isSectionSelectionValid(state: SectionState, definition: SectionDefinition): boolean {
  if (definition.mode === "range") {
    return state.range !== null && isValidPosition(state.range);
  }
  return state.lines.length > 0;
}

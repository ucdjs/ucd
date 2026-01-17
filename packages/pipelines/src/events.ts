import type { FileContext } from "./types";

export type PipelineEventType =
  | "pipeline:start"
  | "pipeline:end"
  | "version:start"
  | "version:end"
  | "artifact:start"
  | "artifact:end"
  | "file:matched"
  | "file:skipped"
  | "file:fallback"
  | "parse:start"
  | "parse:end"
  | "resolve:start"
  | "resolve:end"
  | "error";

export type PipelineStartEvent = {
  type: "pipeline:start";
  versions: string[];
  timestamp: number;
};

export type PipelineEndEvent = {
  type: "pipeline:end";
  durationMs: number;
  timestamp: number;
};

export type VersionStartEvent = {
  type: "version:start";
  version: string;
  timestamp: number;
};

export type VersionEndEvent = {
  type: "version:end";
  version: string;
  durationMs: number;
  timestamp: number;
};

export type ArtifactStartEvent = {
  type: "artifact:start";
  artifactId: string;
  version: string;
  timestamp: number;
};

export type ArtifactEndEvent = {
  type: "artifact:end";
  artifactId: string;
  version: string;
  durationMs: number;
  timestamp: number;
};

export type FileMatchedEvent = {
  type: "file:matched";
  file: FileContext;
  routeId: string;
  timestamp: number;
};

export type FileSkippedEvent = {
  type: "file:skipped";
  file: FileContext;
  reason: "no-match" | "filtered";
  timestamp: number;
};

export type FileFallbackEvent = {
  type: "file:fallback";
  file: FileContext;
  timestamp: number;
};

export type ParseStartEvent = {
  type: "parse:start";
  file: FileContext;
  routeId: string;
  timestamp: number;
};

export type ParseEndEvent = {
  type: "parse:end";
  file: FileContext;
  routeId: string;
  rowCount: number;
  durationMs: number;
  timestamp: number;
};

export type ResolveStartEvent = {
  type: "resolve:start";
  file: FileContext;
  routeId: string;
  timestamp: number;
};

export type ResolveEndEvent = {
  type: "resolve:end";
  file: FileContext;
  routeId: string;
  outputCount: number;
  durationMs: number;
  timestamp: number;
};

export type PipelineErrorEvent = {
  type: "error";
  error: PipelineError;
  timestamp: number;
};

export type PipelineEvent =
  | PipelineStartEvent
  | PipelineEndEvent
  | VersionStartEvent
  | VersionEndEvent
  | ArtifactStartEvent
  | ArtifactEndEvent
  | FileMatchedEvent
  | FileSkippedEvent
  | FileFallbackEvent
  | ParseStartEvent
  | ParseEndEvent
  | ResolveStartEvent
  | ResolveEndEvent
  | PipelineErrorEvent;

export type PipelineErrorScope = "pipeline" | "version" | "file" | "route" | "artifact";

export interface PipelineError {
  scope: PipelineErrorScope;
  message: string;
  error?: unknown;
  file?: FileContext;
  routeId?: string;
  artifactId?: string;
  version?: string;
}

export type PipelineGraphNodeType = "source" | "file" | "route" | "artifact" | "output";

export type PipelineGraphNode =
  | { id: string; type: "source"; version: string }
  | { id: string; type: "file"; file: FileContext }
  | { id: string; type: "route"; routeId: string }
  | { id: string; type: "artifact"; artifactId: string }
  | { id: string; type: "output"; outputIndex: number; property?: string };

export type PipelineGraphEdgeType = "provides" | "matched" | "parsed" | "resolved" | "uses-artifact";

export interface PipelineGraphEdge {
  from: string;
  to: string;
  type: PipelineGraphEdgeType;
}

export interface PipelineGraph {
  nodes: PipelineGraphNode[];
  edges: PipelineGraphEdge[];
}

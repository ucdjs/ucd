import type { FileContext } from "./types";

export type PipelineEventType
  = | "pipeline:start"
    | "pipeline:end"
    | "version:start"
    | "version:end"
    | "artifact:start"
    | "artifact:end"
    | "artifact:produced"
    | "artifact:consumed"
    | "file:matched"
    | "file:skipped"
    | "file:fallback"
    | "parse:start"
    | "parse:end"
    | "resolve:start"
    | "resolve:end"
    | "cache:hit"
    | "cache:miss"
    | "cache:store"
    | "error";

export interface PipelineStartEvent {
  type: "pipeline:start";
  versions: string[];
  timestamp: number;
}

export interface PipelineEndEvent {
  type: "pipeline:end";
  durationMs: number;
  timestamp: number;
}

export interface VersionStartEvent {
  type: "version:start";
  version: string;
  timestamp: number;
}

export interface VersionEndEvent {
  type: "version:end";
  version: string;
  durationMs: number;
  timestamp: number;
}

export interface ArtifactStartEvent {
  type: "artifact:start";
  artifactId: string;
  version: string;
  timestamp: number;
}

export interface ArtifactEndEvent {
  type: "artifact:end";
  artifactId: string;
  version: string;
  durationMs: number;
  timestamp: number;
}

export interface ArtifactProducedEvent {
  type: "artifact:produced";
  artifactId: string;
  routeId: string;
  version: string;
  timestamp: number;
}

export interface ArtifactConsumedEvent {
  type: "artifact:consumed";
  artifactId: string;
  routeId: string;
  version: string;
  timestamp: number;
}

export interface FileMatchedEvent {
  type: "file:matched";
  file: FileContext;
  routeId: string;
  timestamp: number;
}

export interface FileSkippedEvent {
  type: "file:skipped";
  file: FileContext;
  reason: "no-match" | "filtered";
  timestamp: number;
}

export interface FileFallbackEvent {
  type: "file:fallback";
  file: FileContext;
  timestamp: number;
}

export interface ParseStartEvent {
  type: "parse:start";
  file: FileContext;
  routeId: string;
  timestamp: number;
}

export interface ParseEndEvent {
  type: "parse:end";
  file: FileContext;
  routeId: string;
  rowCount: number;
  durationMs: number;
  timestamp: number;
}

export interface ResolveStartEvent {
  type: "resolve:start";
  file: FileContext;
  routeId: string;
  timestamp: number;
}

export interface ResolveEndEvent {
  type: "resolve:end";
  file: FileContext;
  routeId: string;
  outputCount: number;
  durationMs: number;
  timestamp: number;
}

export interface CacheHitEvent {
  type: "cache:hit";
  routeId: string;
  file: FileContext;
  version: string;
  timestamp: number;
}

export interface CacheMissEvent {
  type: "cache:miss";
  routeId: string;
  file: FileContext;
  version: string;
  timestamp: number;
}

export interface CacheStoreEvent {
  type: "cache:store";
  routeId: string;
  file: FileContext;
  version: string;
  timestamp: number;
}

export interface PipelineErrorEvent {
  type: "error";
  error: PipelineError;
  timestamp: number;
}

export type PipelineEvent
  = | PipelineStartEvent
    | PipelineEndEvent
    | VersionStartEvent
    | VersionEndEvent
    | ArtifactStartEvent
    | ArtifactEndEvent
    | ArtifactProducedEvent
    | ArtifactConsumedEvent
    | FileMatchedEvent
    | FileSkippedEvent
    | FileFallbackEvent
    | ParseStartEvent
    | ParseEndEvent
    | ResolveStartEvent
    | ResolveEndEvent
    | CacheHitEvent
    | CacheMissEvent
    | CacheStoreEvent
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

export type PipelineGraphNode
  = | { id: string; type: "source"; version: string }
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

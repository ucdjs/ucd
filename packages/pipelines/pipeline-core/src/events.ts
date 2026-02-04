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
  id: string;
  type: "pipeline:start";
  versions: string[];
  timestamp: number;
}

export interface PipelineEndEvent {
  id: string;
  type: "pipeline:end";
  durationMs: number;
  timestamp: number;
}

export interface VersionStartEvent {
  id: string;
  type: "version:start";
  version: string;
  timestamp: number;
}

export interface VersionEndEvent {
  id: string;
  type: "version:end";
  version: string;
  durationMs: number;
  timestamp: number;
}

export interface ArtifactStartEvent {
  id: string;
  type: "artifact:start";
  artifactId: string;
  version: string;
  timestamp: number;
}

export interface ArtifactEndEvent {
  id: string;
  type: "artifact:end";
  artifactId: string;
  version: string;
  durationMs: number;
  timestamp: number;
}

export interface ArtifactProducedEvent {
  id: string;
  type: "artifact:produced";
  artifactId: string;
  routeId: string;
  version: string;
  timestamp: number;
}

export interface ArtifactConsumedEvent {
  id: string;
  type: "artifact:consumed";
  artifactId: string;
  routeId: string;
  version: string;
  timestamp: number;
}

export interface FileMatchedEvent {
  id: string;
  type: "file:matched";
  file: FileContext;
  routeId: string;
  timestamp: number;
}

export interface FileSkippedEvent {
  id: string;
  type: "file:skipped";
  file: FileContext;
  reason: "no-match" | "filtered";
  timestamp: number;
}

export interface FileFallbackEvent {
  id: string;
  type: "file:fallback";
  file: FileContext;
  timestamp: number;
}

export interface ParseStartEvent {
  id: string;
  type: "parse:start";
  file: FileContext;
  routeId: string;
  timestamp: number;
}

export interface ParseEndEvent {
  id: string;
  type: "parse:end";
  file: FileContext;
  routeId: string;
  rowCount: number;
  durationMs: number;
  timestamp: number;
}

export interface ResolveStartEvent {
  id: string;
  type: "resolve:start";
  file: FileContext;
  routeId: string;
  timestamp: number;
}

export interface ResolveEndEvent {
  id: string;
  type: "resolve:end";
  file: FileContext;
  routeId: string;
  outputCount: number;
  durationMs: number;
  timestamp: number;
}

export interface CacheHitEvent {
  id: string;
  type: "cache:hit";
  routeId: string;
  file: FileContext;
  version: string;
  timestamp: number;
}

export interface CacheMissEvent {
  id: string;
  type: "cache:miss";
  routeId: string;
  file: FileContext;
  version: string;
  timestamp: number;
}

export interface CacheStoreEvent {
  id: string;
  type: "cache:store";
  routeId: string;
  file: FileContext;
  version: string;
  timestamp: number;
}

export interface PipelineErrorEvent {
  id: string;
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

/**
 * Helper type for creating events without IDs.
 * The ID will be automatically assigned by the emit function.
 */
export type PipelineEventInput = 
  | Omit<PipelineStartEvent, "id"> & { id?: string }
  | Omit<PipelineEndEvent, "id"> & { id?: string }
  | Omit<VersionStartEvent, "id"> & { id?: string }
  | Omit<VersionEndEvent, "id"> & { id?: string }
  | Omit<ArtifactStartEvent, "id"> & { id?: string }
  | Omit<ArtifactEndEvent, "id"> & { id?: string }
  | Omit<ArtifactProducedEvent, "id"> & { id?: string }
  | Omit<ArtifactConsumedEvent, "id"> & { id?: string }
  | Omit<FileMatchedEvent, "id"> & { id?: string }
  | Omit<FileSkippedEvent, "id"> & { id?: string }
  | Omit<FileFallbackEvent, "id"> & { id?: string }
  | Omit<ParseStartEvent, "id"> & { id?: string }
  | Omit<ParseEndEvent, "id"> & { id?: string }
  | Omit<ResolveStartEvent, "id"> & { id?: string }
  | Omit<ResolveEndEvent, "id"> & { id?: string }
  | Omit<CacheHitEvent, "id"> & { id?: string }
  | Omit<CacheMissEvent, "id"> & { id?: string }
  | Omit<CacheStoreEvent, "id"> & { id?: string }
  | Omit<PipelineErrorEvent, "id"> & { id?: string };

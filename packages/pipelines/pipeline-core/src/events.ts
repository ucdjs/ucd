import type { FileContext } from "./types";

export type PipelineEventType
  = | "pipeline:start"
    | "pipeline:end"
    | "version:start"
    | "version:end"
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

export const PIPELINE_EVENT_PHASES = [
  "Pipeline",
  "Version",
  "Parse",
  "Resolve",
  "File",
  "Cache",
  "Error",
  "Other",
] as const;

export type PipelineEventPhase = typeof PIPELINE_EVENT_PHASES[number];

export function getPipelineEventPhase(type: PipelineEventType | string): PipelineEventPhase {
  if (type === "error") return "Error";
  if (type.startsWith("pipeline:")) return "Pipeline";
  if (type.startsWith("version:")) return "Version";
  if (type.startsWith("parse:")) return "Parse";
  if (type.startsWith("resolve:")) return "Resolve";
  if (type.startsWith("file:")) return "File";
  if (type.startsWith("cache:")) return "Cache";
  return "Other";
}

export interface PipelineStartEvent {
  id: string;
  type: "pipeline:start";
  versions: string[];
  spanId: string;
  timestamp: number;
}

export interface PipelineEndEvent {
  id: string;
  type: "pipeline:end";
  durationMs: number;
  spanId: string;
  timestamp: number;
}

export interface VersionStartEvent {
  id: string;
  type: "version:start";
  version: string;
  spanId: string;
  timestamp: number;
}

export interface VersionEndEvent {
  id: string;
  type: "version:end";
  version: string;
  durationMs: number;
  spanId: string;
  timestamp: number;
}

export interface FileMatchedEvent {
  id: string;
  type: "file:matched";
  file: FileContext;
  routeId: string;
  spanId: string;
  timestamp: number;
}

export interface FileSkippedEvent {
  id: string;
  type: "file:skipped";
  file: FileContext;
  reason: "no-match" | "filtered";
  spanId: string;
  timestamp: number;
}

export interface FileFallbackEvent {
  id: string;
  type: "file:fallback";
  file: FileContext;
  spanId: string;
  timestamp: number;
}

export interface ParseStartEvent {
  id: string;
  type: "parse:start";
  file: FileContext;
  routeId: string;
  spanId: string;
  timestamp: number;
}

export interface ParseEndEvent {
  id: string;
  type: "parse:end";
  file: FileContext;
  routeId: string;
  rowCount: number;
  durationMs: number;
  spanId: string;
  timestamp: number;
}

export interface ResolveStartEvent {
  id: string;
  type: "resolve:start";
  file: FileContext;
  routeId: string;
  spanId: string;
  timestamp: number;
}

export interface ResolveEndEvent {
  id: string;
  type: "resolve:end";
  file: FileContext;
  routeId: string;
  outputCount: number;
  durationMs: number;
  spanId: string;
  timestamp: number;
}

export interface CacheHitEvent {
  id: string;
  type: "cache:hit";
  routeId: string;
  file: FileContext;
  version: string;
  spanId: string;
  timestamp: number;
}

export interface CacheMissEvent {
  id: string;
  type: "cache:miss";
  routeId: string;
  file: FileContext;
  version: string;
  spanId: string;
  timestamp: number;
}

export interface CacheStoreEvent {
  id: string;
  type: "cache:store";
  routeId: string;
  file: FileContext;
  version: string;
  spanId: string;
  timestamp: number;
}

export interface PipelineErrorEvent {
  id: string;
  type: "error";
  error: PipelineError;
  spanId: string;
  timestamp: number;
}

export type PipelineEvent
  = | PipelineStartEvent
    | PipelineEndEvent
    | VersionStartEvent
    | VersionEndEvent
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

export type PipelineErrorScope = "pipeline" | "version" | "file" | "route";

export interface PipelineError {
  scope: PipelineErrorScope;
  message: string;
  error?: unknown;
  file?: FileContext;
  routeId?: string;
  version?: string;
}

export type PipelineGraphNodeType = "source" | "file" | "route" | "output";

export type PipelineGraphNode
  = | { id: string; type: "source"; version: string }
    | { id: string; type: "file"; file: FileContext }
    | { id: string; type: "route"; routeId: string }
    | { id: string; type: "output"; outputIndex: number; property?: string; outputId?: string; locator?: string };

export type PipelineGraphEdgeType = "provides" | "matched" | "parsed" | "resolved";

export interface PipelineGraphEdge {
  from: string;
  to: string;
  type: PipelineGraphEdgeType;
}

export interface PipelineGraph {
  nodes: PipelineGraphNode[];
  edges: PipelineGraphEdge[];
}

export type PipelineEventInput
  = | Omit<PipelineStartEvent, "id" | "spanId"> & { id?: string; spanId?: string }
    | Omit<PipelineEndEvent, "id" | "spanId"> & { id?: string; spanId?: string }
    | Omit<VersionStartEvent, "id" | "spanId"> & { id?: string; spanId?: string }
    | Omit<VersionEndEvent, "id" | "spanId"> & { id?: string; spanId?: string }
    | Omit<FileMatchedEvent, "id" | "spanId"> & { id?: string; spanId?: string }
    | Omit<FileSkippedEvent, "id" | "spanId"> & { id?: string; spanId?: string }
    | Omit<FileFallbackEvent, "id" | "spanId"> & { id?: string; spanId?: string }
    | Omit<ParseStartEvent, "id" | "spanId"> & { id?: string; spanId?: string }
    | Omit<ParseEndEvent, "id" | "spanId"> & { id?: string; spanId?: string }
    | Omit<ResolveStartEvent, "id" | "spanId"> & { id?: string; spanId?: string }
    | Omit<ResolveEndEvent, "id" | "spanId"> & { id?: string; spanId?: string }
    | Omit<CacheHitEvent, "id" | "spanId"> & { id?: string; spanId?: string }
    | Omit<CacheMissEvent, "id" | "spanId"> & { id?: string; spanId?: string }
    | Omit<CacheStoreEvent, "id" | "spanId"> & { id?: string; spanId?: string }
    | Omit<PipelineErrorEvent, "id" | "spanId"> & { id?: string; spanId?: string };

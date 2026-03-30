import type { Database } from "#server/db";
import type { ExecutionLogPayload as NullableLogPayload } from "#shared/schemas/execution";
import type { PipelineLogEntry, PipelineLogLevel, PipelineLogSource } from "@ucdjs/pipelines-executor";
import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";
import { schema } from "#server/db";

type ExecutionLogPayload = NonNullable<NullableLogPayload>;

const MAX_LINE_BYTES = 256 * 1024;
const MAX_TOTAL_BYTES = 5 * 1024 * 1024;

export interface ExecutionLogState {
  capturedBytes: number;
  truncated: boolean;
  originalBytes: number;
}

export interface LogCaptureResult {
  stored: boolean;
  truncated: boolean;
  bytes: number;
  originalBytes: number;
  limitReached: boolean;
}

export interface ExecutionLogOptions {
  executionId: string;
  workspaceId: string;
  spanId?: string;
  message: string;
  level: PipelineLogLevel | null;
  source: PipelineLogSource;
  payload: ExecutionLogPayload;
  timestamp?: Date;
  force?: boolean;
}

function truncateToBytes(str: string, maxBytes: number): string {
  let low = 0;
  let high = str.length;
  let best = 0;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (Buffer.byteLength(str.slice(0, mid), "utf-8") <= maxBytes) {
      best = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return str.slice(0, best);
}

function truncateLogLine(message: string): { message: string; truncated: boolean; originalBytes: number } {
  const originalBytes = Buffer.byteLength(message, "utf-8");
  if (originalBytes <= MAX_LINE_BYTES) {
    return { message, truncated: false, originalBytes };
  }

  return {
    message: truncateToBytes(message, MAX_LINE_BYTES),
    truncated: true,
    originalBytes,
  };
}

export async function storeExecutionLog(
  db: Database,
  state: ExecutionLogState,
  options: ExecutionLogOptions,
): Promise<LogCaptureResult> {
  if (state.capturedBytes >= MAX_TOTAL_BYTES && !options.force) {
    state.originalBytes += Buffer.byteLength(options.message, "utf-8");
    state.truncated = true;
    return {
      stored: false,
      truncated: true,
      bytes: 0,
      originalBytes: state.originalBytes,
      limitReached: true,
    };
  }

  const line = truncateLogLine(options.message);
  const payload: ExecutionLogPayload = {
    ...options.payload,
    truncated: options.payload.truncated || line.truncated || undefined,
    originalSize: options.payload.originalSize ?? (line.truncated ? line.originalBytes : undefined),
  };

  const messageBytes = Buffer.byteLength(line.message, "utf-8");
  const remaining = MAX_TOTAL_BYTES - state.capturedBytes;
  let finalMessage = line.message;
  if (messageBytes > remaining && !options.force) {
    finalMessage = truncateToBytes(line.message, remaining);
  }

  const finalBytes = Buffer.byteLength(finalMessage, "utf-8");
  const overflowed = messageBytes > remaining && !options.force;
  const truncated = line.truncated || overflowed;

  state.originalBytes += line.originalBytes;
  state.capturedBytes += finalBytes;
  state.truncated = state.truncated || truncated || state.capturedBytes >= MAX_TOTAL_BYTES;

  if (overflowed || (state.capturedBytes >= MAX_TOTAL_BYTES && !options.force)) {
    payload.truncated = true;
    payload.originalSize = payload.originalSize ?? line.originalBytes;
  }

  await db.insert(schema.executionLogs).values({
    id: randomUUID(),
    workspaceId: options.workspaceId,
    executionId: options.executionId,
    spanId: options.spanId ?? null,
    message: finalMessage,
    level: options.level,
    source: options.source,
    timestamp: options.timestamp ?? new Date(),
    payload,
  });

  return {
    stored: true,
    truncated: state.truncated,
    bytes: finalBytes,
    originalBytes: state.originalBytes,
    limitReached: overflowed || (state.capturedBytes >= MAX_TOTAL_BYTES && !options.force),
  };
}

export function createExecutionLogState(): ExecutionLogState {
  return {
    capturedBytes: 0,
    truncated: false,
    originalBytes: 0,
  };
}

export function buildTruncationBanner(
  state: ExecutionLogState,
): ExecutionLogPayload {
  const total = state.originalBytes > 0 ? state.originalBytes : state.capturedBytes;
  return {
    truncated: true,
    isBanner: true,
    originalSize: total,
  };
}

interface ExecutionCaptureState {
  state: ExecutionLogState;
  truncatedLogged: boolean;
  limitReached: boolean;
}

export function createExecutionLogStore(db: Database) {
  const stateByExecution = new Map<string, ExecutionCaptureState>();

  return async (entry: PipelineLogEntry): Promise<void> => {
    // Keep only non-string args - strings are already folded into `message` by the formatter.
    // e.g. console.log("prefix:", { a: 1 }) → args: [{ a: 1 }], message: "prefix: { a: 1 }"
    const extraArgs = entry.args?.filter((arg) => typeof arg !== "string");
    const args = extraArgs && extraArgs.length > 0 ? extraArgs : undefined;

    const payload: ExecutionLogPayload = {
      args,
      meta: entry.meta,
    };

    let executionState = stateByExecution.get(entry.executionId);
    if (!executionState) {
      executionState = {
        state: createExecutionLogState(),
        truncatedLogged: false,
        limitReached: false,
      };
      stateByExecution.set(entry.executionId, executionState);
    }

    const result = await storeExecutionLog(db, executionState.state, {
      executionId: entry.executionId,
      workspaceId: entry.workspaceId,
      spanId: entry.spanId,
      message: entry.message,
      level: entry.level,
      source: entry.source,
      payload,
      timestamp: new Date(entry.timestamp),
    });

    if (result.limitReached) {
      executionState.limitReached = true;
    }

    if ((result.truncated || executionState.limitReached) && !executionState.truncatedLogged) {
      executionState.truncatedLogged = true;
      const bannerPayload = buildTruncationBanner(executionState.state);
      await storeExecutionLog(db, executionState.state, {
        executionId: entry.executionId,
        workspaceId: entry.workspaceId,
        spanId: entry.spanId,
        message: "Execution logs truncated due to size limits.",
        level: entry.level,
        source: entry.source,
        payload: bannerPayload,
        timestamp: new Date(entry.timestamp),
        force: true,
      });
    }
  };
}

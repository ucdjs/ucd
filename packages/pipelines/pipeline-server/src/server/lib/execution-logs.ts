import type { Database } from "#server/db";
import type { ExecutionLogPayload, ExecutionLogStream } from "#server/db/schema";
import { randomUUID } from "node:crypto";
import { schema } from "#server/db";

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
  spanId?: string;
  stream: ExecutionLogStream;
  message: string;
  payload: ExecutionLogPayload;
  timestamp?: Date;
  force?: boolean;
}

function truncateLogLine(message: string): { message: string; truncated: boolean; originalBytes: number } {
  const originalBytes = Buffer.byteLength(message, "utf-8");
  if (originalBytes <= MAX_LINE_BYTES) {
    return { message, truncated: false, originalBytes };
  }

  let low = 0;
  let high = message.length;
  let best = 0;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const slice = message.slice(0, mid);
    const size = Buffer.byteLength(slice, "utf-8");
    if (size <= MAX_LINE_BYTES) {
      best = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return {
    message: message.slice(0, best),
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
    let low = 0;
    let high = line.message.length;
    let best = 0;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const slice = line.message.slice(0, mid);
      const size = Buffer.byteLength(slice, "utf-8");
      if (size <= remaining) {
        best = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    finalMessage = line.message.slice(0, best);
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
    executionId: options.executionId,
    spanId: options.spanId ?? null,
    stream: options.stream,
    message: finalMessage,
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
  stream: ExecutionLogStream,
): ExecutionLogPayload {
  const total = state.originalBytes > 0 ? state.originalBytes : state.capturedBytes;
  return {
    message: "Execution logs truncated due to size limits.",
    stream,
    truncated: true,
    originalSize: total,
  };
}

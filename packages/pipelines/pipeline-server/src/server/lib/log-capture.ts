/* eslint-disable no-console */
import type { Database } from "#server/db";
import type { ExecutionLogPayload, ExecutionLogStream } from "#server/db/schema";
import { buildTruncationBanner, createExecutionLogState, storeExecutionLog } from "#server/lib/execution-logs";
import { getPipelineExecutionContext } from "@ucdjs/pipelines-executor";

export interface LogCaptureController {
  start: () => void;
  stop: () => Promise<void>;
}

interface ExecutionCaptureState {
  executionId: string;
  state: ReturnType<typeof createExecutionLogState>;
  truncatedLogged: boolean;
  limitReached: boolean;
}

interface LoggerInput {
  stream: ExecutionLogStream;
  args: unknown[];
}

function buildMessage(args: unknown[]): string {
  if (args.length === 0) {
    return "";
  }

  return args.map((arg) => {
    if (typeof arg === "string") return arg;
    if (arg instanceof Error) return arg.stack ?? arg.message;
    try {
      return JSON.stringify(arg, null, 2);
    } catch {
      return String(arg);
    }
  }).join(" ");
}

function buildPayload(
  args: unknown[],
  message: string,
  stream: ExecutionLogStream,
  event: ExecutionLogPayload["event"],
): ExecutionLogPayload {
  return {
    message,
    stream,
    args: args.length > 0 ? args : undefined,
    event,
  };
}

export function createExecutionLogCapture(db: Database): LogCaptureController {
  const stateByExecution = new Map<string, ExecutionCaptureState>();
  const originalLog = console.log;
  const originalInfo = console.info;
  const originalWarn = console.warn;
  const originalError = console.error;

  async function capture({ stream, args }: LoggerInput): Promise<void> {
    const context = getPipelineExecutionContext();
    if (!context) {
      return;
    }

    const message = buildMessage(args);
    const executionId = context.executionId;
    const spanId = context.spanId;
    const payload = buildPayload(args, message, stream, context.event);

    let executionState = stateByExecution.get(executionId);
    if (!executionState) {
      executionState = {
        executionId,
        state: createExecutionLogState(),
        truncatedLogged: false,
        limitReached: false,
      };
      stateByExecution.set(executionId, executionState);
    }

    const result = await storeExecutionLog(db, executionState.state, {
      executionId,
      spanId,
      stream,
      message,
      payload,
    });

    if (result.limitReached) {
      executionState.limitReached = true;
    }

    if ((result.truncated || executionState.limitReached) && !executionState.truncatedLogged) {
      executionState.truncatedLogged = true;
      const bannerPayload = buildTruncationBanner(executionState.state, stream);
      await storeExecutionLog(db, executionState.state, {
        executionId,
        spanId,
        stream,
        message: bannerPayload.message,
        payload: bannerPayload,
        force: true,
      });
    }
  }

  function wrapLogger(stream: ExecutionLogStream, original: (...args: unknown[]) => void) {
    return (...args: unknown[]) => {
      void capture({ stream, args });
      original(...args);
    };
  }

  return {
    start: () => {
      console.log = wrapLogger("stdout", originalLog);
      console.info = wrapLogger("stdout", originalInfo);
      console.warn = wrapLogger("stderr", originalWarn);
      console.error = wrapLogger("stderr", originalError);
    },
    stop: async () => {
      console.log = originalLog;
      console.info = originalInfo;
      console.warn = originalWarn;
      console.error = originalError;
      stateByExecution.clear();
    },
  };
}

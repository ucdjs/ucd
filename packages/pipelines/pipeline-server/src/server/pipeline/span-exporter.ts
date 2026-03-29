import type { Database } from "#server/db";
import type { ReadableSpan, SpanExporter } from "@opentelemetry/sdk-trace-node";
import type { FileContext } from "@ucdjs/pipelines-core";
import type { PipelineTraceKind, PipelineTraceRecord } from "@ucdjs/pipelines-core/tracing";
import { schema } from "#server/db";
import { SpanStatusCode } from "@opentelemetry/api";

export interface PipelineSpanExporterOptions {
  db: Database;
  workspaceId: string;
  executionId: string;
}

function generateId(): string {
  return Array.from(
    crypto.getRandomValues(new Uint8Array(16)),
    (b) => b.toString(16).padStart(2, "0"),
  ).join("");
}

/** Converts an OTel high-resolution time tuple to Unix milliseconds. */
function hrTimeToMs(hrTime: [number, number]): number {
  return hrTime[0] * 1000 + hrTime[1] / 1_000_000;
}

type SpanAttributes = ReadableSpan["attributes"];

function extractFileContext(attrs: SpanAttributes): FileContext | undefined {
  const filePath = attrs["file.path"];
  if (!filePath) {
    return undefined;
  }
  return {
    path: String(filePath),
    name: String(attrs["file.name"] ?? ""),
    dir: String(attrs["file.dir"] ?? ""),
    ext: String(attrs["file.ext"] ?? ""),
    version: String(attrs["file.version"] ?? ""),
  };
}

function str(val: unknown): string {
  return val != null ? String(val) : "";
}

function num(val: unknown): number {
  return typeof val === "number" ? val : Number(val ?? 0);
}

/**
 * Build the `data` JSON object for a span row, merging span attributes into
 * the PipelineTraceRecord shape the rest of the server expects.
 */
function buildSpanData(
  span: ReadableSpan,
  traceId: string,
  spanId: string,
  parentSpanId: string | undefined,
  startMs: number,
  endMs: number,
): PipelineTraceRecord {
  const attrs = span.attributes;
  const durationMs = endMs - startMs;
  const pipelineId = str(attrs["pipeline.id"]);
  const version = str(attrs["pipeline.version"]);
  const routeId = str(attrs["route.id"]);
  const file = extractFileContext(attrs);
  const kind = span.name as PipelineTraceKind;

  const base = {
    id: generateId(),
    kind,
    pipelineId,
    traceId,
    spanId,
    parentSpanId,
    timestamp: endMs,
  };

  switch (span.name) {
    case "pipeline":
      return {
        ...base,
        kind: "pipeline",
        versions: (attrs["pipeline.versions"] as string[] | undefined) ?? [],
        startTimestamp: startMs,
        durationMs,
      };
    case "version":
      return {
        ...base,
        kind: "version",
        version,
        startTimestamp: startMs,
        durationMs,
      };
    case "source.listing":
      return {
        ...base,
        kind: "source.listing",
        version,
        fileCount: num(attrs["file.count"]),
        startTimestamp: startMs,
        durationMs,
      };
    case "file.route":
      return {
        ...base,
        kind: "file.route",
        version,
        routeId,
        file: file!,
        startTimestamp: startMs,
        durationMs,
      };
    case "parse":
      return {
        ...base,
        kind: "parse",
        version,
        routeId,
        file: file!,
        rowCount: num(attrs["row.count"]),
        filteredRowCount: num(attrs["filtered.row.count"]),
        startTimestamp: startMs,
        durationMs,
      };
    case "resolve":
      return {
        ...base,
        kind: "resolve",
        version,
        routeId,
        file: file!,
        outputCount: num(attrs["output.count"]),
        startTimestamp: startMs,
        durationMs,
      };
    case "output":
      return {
        ...base,
        kind: "output",
        version,
        routeId,
        file: file!,
        outputIndex: num(attrs["output.index"]),
        outputId: str(attrs["output.id"]),
        property: str(attrs["output.property"]) || undefined,
        sink: str(attrs["output.sink"]),
        format: (attrs["output.format"] as "json" | "text") ?? "json",
        locator: str(attrs["output.locator"]),
      };
    default:
      // Generic fallback: spread all attributes into data
      return { ...base, ...(attrs as Record<string, unknown>) } as unknown as PipelineTraceRecord;
  }
}

/**
 * Build the `data` JSON object for an event row, combining parent span
 * attributes with the event's own attributes.
 */
function buildEventData(
  span: ReadableSpan,
  eventName: string,
  eventAttrs: SpanAttributes,
  traceId: string,
  spanId: string,
  parentSpanId: string | undefined,
  eventMs: number,
): PipelineTraceRecord | null {
  const attrs = span.attributes;
  const pipelineId = str(attrs["pipeline.id"]);
  const version = str(attrs["pipeline.version"]);
  const file = extractFileContext({ ...attrs, ...eventAttrs });
  const routeId = str(eventAttrs["route.id"] ?? attrs["route.id"]);

  const base = {
    id: generateId(),
    pipelineId,
    traceId,
    spanId,
    parentSpanId,
    timestamp: eventMs,
  };

  switch (eventName) {
    case "source.provided":
      return { ...base, kind: "source.provided", version, file };
    case "file.matched":
      return { ...base, kind: "file.matched", version, routeId, file: file! };
    case "file.fallback":
      return { ...base, kind: "file.fallback", version, file: file! };
    case "file.skipped":
      return {
        ...base,
        kind: "file.skipped",
        version,
        file: file!,
        reason: (eventAttrs["skipped.reason"] as "no-match" | "filtered") ?? "no-match",
      };
    case "file.queued":
      return { ...base, kind: "file.queued", version, routeId, file: file! };
    case "file.dequeued":
      return {
        ...base,
        kind: "file.dequeued",
        version,
        routeId,
        file: file!,
        waitDurationMs: num(eventAttrs["wait.ms"]),
      };
    case "cache.hit":
      return { ...base, kind: "cache.hit", version, routeId, file: file! };
    case "cache.miss":
      return { ...base, kind: "cache.miss", version, routeId, file: file! };
    case "cache.store":
      return { ...base, kind: "cache.store", version, routeId, file: file! };
    case "dependency.resolve":
      return {
        ...base,
        kind: "dependency.resolve",
        version,
        routeId: str(eventAttrs["route.id"]),
        file: file!,
        dependsOnRouteId: str(eventAttrs["depends.on.route.id"]),
        status: (eventAttrs["dependency.status"] as "resolved" | "missing") ?? "resolved",
      };
    case "output.produced":
      return {
        ...base,
        kind: "output.produced",
        version,
        routeId: str(eventAttrs["route.id"] ?? attrs["route.id"]),
        file,
        outputIndex: num(eventAttrs["output.index"]),
        property: str(eventAttrs["output.property"]) || undefined,
      };
    case "output.written":
      return {
        ...base,
        kind: "output.written",
        version,
        routeId: str(eventAttrs["route.id"] ?? attrs["route.id"]),
        file: file!,
        outputIndex: num(eventAttrs["output.index"] ?? attrs["output.index"]),
        outputId: str(eventAttrs["output.id"] ?? attrs["output.id"]),
        property: str(eventAttrs["output.property"] ?? attrs["output.property"]) || undefined,
        sink: str(eventAttrs["output.sink"] ?? attrs["output.sink"]),
        locator: str(eventAttrs["output.locator"] ?? attrs["output.locator"]),
        status: (eventAttrs["output.status"] as "written" | "failed") ?? "written",
        error: eventAttrs["output.error"] ? str(eventAttrs["output.error"]) : undefined,
      };
    case "exception":
      // OTel standard exception event -record as pipeline error trace
      return {
        ...base,
        kind: "error",
        error: {
          scope: str(attrs["error.scope"] || "route"),
          message: str(eventAttrs["exception.message"]),
          routeId: routeId || undefined,
          version: version || undefined,
          file: file || undefined,
        },
        stack: str(eventAttrs["exception.stacktrace"]) || undefined,
      } as unknown as PipelineTraceRecord;
    default:
      return null;
  }
}

async function persistSpans(
  db: Database,
  workspaceId: string,
  executionId: string,
  spans: readonly ReadableSpan[],
): Promise<void> {
  const rows: typeof schema.executionTraces.$inferInsert[] = [];

  for (const span of spans) {
    const spanCtx = span.spanContext();
    const traceId = spanCtx.traceId;
    const spanId = spanCtx.spanId;
    const parentSpanId = span.parentSpanContext?.spanId ?? undefined;
    const startMs = hrTimeToMs(span.startTime);
    const endMs = hrTimeToMs(span.endTime);

    // Main span row
    const spanData = buildSpanData(span, traceId, spanId, parentSpanId, startMs, endMs);
    rows.push({
      id: generateId(),
      workspaceId,
      executionId,
      traceId,
      spanId,
      parentSpanId: parentSpanId ?? null,
      kind: span.name as PipelineTraceKind,
      startTimestamp: startMs,
      durationMs: endMs - startMs,
      endTimestamp: new Date(endMs),
      data: spanData,
    });

    // One row per span event
    for (const event of span.events) {
      const eventMs = hrTimeToMs(event.time);
      const eventData = buildEventData(
        span,
        event.name,
        event.attributes ?? {},
        traceId,
        spanId,
        parentSpanId,
        eventMs,
      );
      if (!eventData) {
        continue;
      }

      const eventKind = event.name === "exception" ? "error" : event.name;
      rows.push({
        id: generateId(),
        workspaceId,
        executionId,
        traceId,
        spanId,
        parentSpanId: parentSpanId ?? null,
        kind: eventKind as PipelineTraceKind,
        durationMs: null,
        endTimestamp: new Date(eventMs),
        data: eventData,
      });
    }

    // If span ended with error status and no exception event was emitted, write a synthetic error row
    if (
      span.status.code === SpanStatusCode.ERROR
      && !span.events.some((e) => e.name === "exception")
      && span.status.message
    ) {
      const routeId = str(span.attributes["route.id"]);
      const version = str(span.attributes["pipeline.version"]);
      const file = extractFileContext(span.attributes);
      const errorData: PipelineTraceRecord = {
        id: generateId(),
        kind: "error",
        pipelineId: str(span.attributes["pipeline.id"]),
        traceId,
        spanId,
        parentSpanId,
        timestamp: endMs,
        error: {
          scope: "route",
          message: span.status.message,
          routeId: routeId || undefined,
          version: version || undefined,
          file: file || undefined,
        },
      } as unknown as PipelineTraceRecord;

      rows.push({
        id: generateId(),
        workspaceId,
        executionId,
        traceId,
        spanId,
        parentSpanId: parentSpanId ?? null,
        kind: "error",
        durationMs: null,
        endTimestamp: new Date(endMs),
        data: errorData,
      });
    }
  }

  if (rows.length === 0) {
    return;
  }

  // Batch insert in chunks to stay within SQLite parameter limits
  const CHUNK_SIZE = 50;
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    await db.insert(schema.executionTraces).values(rows.slice(i, i + CHUNK_SIZE));
  }
}

export function createPipelineSpanExporter(options: PipelineSpanExporterOptions): SpanExporter {
  const { db, workspaceId, executionId } = options;

  return {
    export(spans: ReadableSpan[], resultCallback: (result: { code: number; error?: Error }) => void): void {
      persistSpans(db, workspaceId, executionId, spans).then(
        () => {
          // eslint-disable-next-line no-console
          console.info(`[trace] exported ${spans.length} span(s) for execution ${executionId}: ${spans.map((s) => s.name).join(", ")}`);
          resultCallback({ code: 0 });
        },
        (err: unknown) => resultCallback({ code: 1, error: err instanceof Error ? err : new Error(String(err)) }),
      );
    },
    shutdown(): Promise<void> {
      return Promise.resolve();
    },
  };
}

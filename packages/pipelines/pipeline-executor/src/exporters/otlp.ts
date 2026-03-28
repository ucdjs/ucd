import type { PipelineTraceRecord } from "@ucdjs/pipelines-core/tracing";

export interface OtlpExporterOptions {
  /** OTLP collector base URL, e.g. `"https://api.honeycomb.io"` or `"http://localhost:4318"`. The path `/v1/traces` is appended automatically. */
  endpoint: string;
  /** Extra HTTP headers, e.g. API keys: `{ "x-honeycomb-team": "MY_KEY" }`. */
  headers?: Record<string, string>;
  /** Resource attributes describing this service, e.g. `{ "service.name": "ucdjs-pipeline" }`. */
  resource?: Record<string, string>;
  /** Called when the fetch to the collector fails. Defaults to `console.error`. */
  onError?: (err: unknown) => void;
}

// ---------------------------------------------------------------------------
// Internal OTLP JSON types (subset of the spec, enough for /v1/traces)
// ---------------------------------------------------------------------------

type OtlpAnyValue =
  | { stringValue: string }
  | { intValue: string }
  | { doubleValue: number }
  | { boolValue: boolean }
  | { arrayValue: { values: { stringValue: string }[] } };

interface OtlpAttribute {
  key: string;
  value: OtlpAnyValue;
}

interface OtlpEvent {
  name: string;
  timeUnixNano: string;
  attributes: OtlpAttribute[];
}

interface OtlpSpan {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  kind: number;
  startTimeUnixNano: string;
  endTimeUnixNano: string;
  attributes: OtlpAttribute[];
  events: OtlpEvent[];
  status: { code: number };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function strAttr(key: string, value: string): OtlpAttribute {
  return { key, value: { stringValue: value } };
}

function numAttr(key: string, value: number): OtlpAttribute {
  return Number.isInteger(value)
    ? { key, value: { intValue: String(value) } }
    : { key, value: { doubleValue: value } };
}

function boolAttr(key: string, value: boolean): OtlpAttribute {
  return { key, value: { boolValue: value } };
}

function strArrayAttr(key: string, values: string[]): OtlpAttribute {
  return { key, value: { arrayValue: { values: values.map(v => ({ stringValue: v })) } } };
}

/** Convert millisecond epoch to nanosecond string (BigInt avoids float precision loss). */
function toNano(ms: number): string {
  return String(BigInt(Math.floor(ms)) * 1_000_000n);
}

// Base fields that exist on every PipelineTraceRecord — excluded from auto-attributes.
const BASE_FIELDS = new Set([
  "id",
  "kind",
  "pipelineId",
  "traceId",
  "spanId",
  "parentSpanId",
  "timestamp",
  "startTimestamp",
  "schemaVersion",
]);

/**
 * Auto-serializes all non-base fields of a trace record into OTLP attributes.
 * Scalars map directly; objects/arrays are JSON-stringified.
 */
function toOtlpAttrs(trace: PipelineTraceRecord): OtlpAttribute[] {
  const attrs: OtlpAttribute[] = [strAttr("pipeline.id", trace.pipelineId)];
  for (const [k, v] of Object.entries(trace)) {
    if (BASE_FIELDS.has(k) || v == null) continue;
    if (typeof v === "string") {
      attrs.push(strAttr(k, v));
    } else if (typeof v === "number") {
      attrs.push(numAttr(k, v));
    } else if (typeof v === "boolean") {
      attrs.push(boolAttr(k, v));
    } else if (Array.isArray(v) && v.every(x => typeof x === "string")) {
      attrs.push(strArrayAttr(k, v as string[]));
    } else {
      attrs.push(strAttr(k, JSON.stringify(v)));
    }
  }
  return attrs;
}

function buildOtlpPayload(
  traces: PipelineTraceRecord[],
  resource: Record<string, string>,
): object {
  const otlpSpans: OtlpSpan[] = [];
  // point events (no startTimestamp) get attached as OTLP span events on their parent span
  const pointEvents: PipelineTraceRecord[] = [];

  for (const trace of traces) {
    if (!trace.spanId) continue;

    const startTs = (trace as { startTimestamp?: number }).startTimestamp;
    if (startTs != null) {
      const span: OtlpSpan = {
        traceId: trace.traceId,
        spanId: trace.spanId,
        name: trace.kind,
        kind: 1, // SPAN_KIND_INTERNAL
        startTimeUnixNano: toNano(startTs),
        endTimeUnixNano: toNano(trace.timestamp),
        attributes: toOtlpAttrs(trace),
        events: [],
        status: { code: 1 },
      };
      if (trace.parentSpanId) {
        span.parentSpanId = trace.parentSpanId;
      }
      otlpSpans.push(span);
    } else {
      pointEvents.push(trace);
    }
  }

  // Attach point events as OTLP span events on their parent span.
  const spanMap = new Map(otlpSpans.map(s => [s.spanId, s]));
  for (const event of pointEvents) {
    if (!event.spanId) continue;
    const parent = spanMap.get(event.spanId);
    if (!parent) continue;
    if (event.kind === "error") parent.status = { code: 2 };
    parent.events.push({
      name: event.kind,
      timeUnixNano: toNano(event.timestamp),
      attributes: toOtlpAttrs(event),
    });
  }

  const resourceAttrs = Object.entries(resource).map(([k, v]) => strAttr(k, v));

  return {
    resourceSpans: [{
      resource: { attributes: resourceAttrs },
      scopeSpans: [{
        scope: { name: "pipeline-executor" },
        spans: otlpSpans,
      }],
    }],
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Creates an `onTrace` handler that exports pipeline traces to an OTLP-compatible
 * collector via HTTP/JSON (`/v1/traces`). No extra dependencies — uses `fetch()`.
 *
 * @example
 * ```ts
 * const onTrace = createOtlpExporter({
 *   endpoint: "https://api.honeycomb.io",
 *   headers: { "x-honeycomb-team": "MY_API_KEY" },
 *   resource: { "service.name": "ucdjs-pipeline" },
 * });
 * const executor = createPipelineExecutor({ ..., onTrace });
 * ```
 */
export function createOtlpExporter(
  options: OtlpExporterOptions,
): (trace: PipelineTraceRecord) => Promise<void> {
  const {
    endpoint,
    headers = {},
    resource = {},
    onError = (err: unknown) => console.error("[otlp-exporter]", err),
  } = options;

  const buffer = new Map<string, PipelineTraceRecord[]>();

  return async (trace: PipelineTraceRecord): Promise<void> => {
    const { traceId } = trace;

    let bucket = buffer.get(traceId);
    if (!bucket) {
      bucket = [];
      buffer.set(traceId, bucket);
    }
    bucket.push(trace);

    if (trace.kind === "pipeline") {
      buffer.delete(traceId);
      try {
        const payload = buildOtlpPayload(bucket, resource);
        const response = await fetch(`${endpoint}/v1/traces`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...headers },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          onError(new Error(`OTLP export failed: ${response.status} ${response.statusText}`));
        }
      } catch (err) {
        onError(err);
      }
    }
  };
}

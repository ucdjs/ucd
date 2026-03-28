import type {
  OutputResolvedTraceRecord,
  PipelineOutputManifestEntry,
  PipelineTraceEmitInput,
  PipelineTraceInput,
  PipelineTraceKind,
  PipelineTraceRecord,
  PipelineTraceRecordByKind,
} from "../../src/tracing";
import { describe, expectTypeOf, it } from "vitest";

type HasKey<T, K extends PropertyKey> = K extends keyof T ? true : false;

describe("tracing types", () => {
  it("maps known kinds to specific trace record variants", () => {
    expectTypeOf<PipelineTraceRecordByKind<"output.resolved">>().toEqualTypeOf<OutputResolvedTraceRecord>();
    expectTypeOf<PipelineTraceRecordByKind<"output.resolved">["kind"]>().toEqualTypeOf<"output.resolved">();
  });

  it("keeps PipelineTraceKind open for extension", () => {
    expectTypeOf<PipelineTraceKind>().toExtend<string>();
    expectTypeOf<"custom.trace">().toExtend<PipelineTraceKind>();
  });

  it("omits runtime-generated fields from PipelineTraceInput", () => {
    expectTypeOf<HasKey<PipelineTraceInput, "id">>().toEqualTypeOf<false>();
    expectTypeOf<HasKey<PipelineTraceInput, "traceId">>().toEqualTypeOf<false>();
    expectTypeOf<HasKey<PipelineTraceInput, "timestamp">>().toEqualTypeOf<false>();
    expectTypeOf<HasKey<PipelineTraceInput, "pipelineId">>().toEqualTypeOf<true>();
  });

  it("omits pipelineId and runtime-generated fields from PipelineTraceEmitInput", () => {
    expectTypeOf<HasKey<PipelineTraceEmitInput, "id">>().toEqualTypeOf<false>();
    expectTypeOf<HasKey<PipelineTraceEmitInput, "traceId">>().toEqualTypeOf<false>();
    expectTypeOf<HasKey<PipelineTraceEmitInput, "timestamp">>().toEqualTypeOf<false>();
    expectTypeOf<HasKey<PipelineTraceEmitInput, "pipelineId">>().toEqualTypeOf<false>();
  });

  it("defines manifest status and format unions", () => {
    expectTypeOf<PipelineOutputManifestEntry["status"]>().toEqualTypeOf<"resolved" | "written" | "failed">();
    expectTypeOf<PipelineOutputManifestEntry["format"]>().toEqualTypeOf<"json" | "text">();
  });

  it("ensures PipelineTraceRecord remains a tagged union", () => {
    expectTypeOf<PipelineTraceRecord["kind"]>().toExtend<PipelineTraceKind>();
  });
});

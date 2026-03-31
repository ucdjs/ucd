import { trace } from "@opentelemetry/api";
import { InMemorySpanExporter, NodeTracerProvider, SimpleSpanProcessor } from "@opentelemetry/sdk-trace-node";

export function setupTestTracing() {
  const exporter = new InMemorySpanExporter();
  const provider = new NodeTracerProvider({
    spanProcessors: [new SimpleSpanProcessor(exporter)],
  });
  provider.register();

  return {
    exporter,
    tracer: trace.getTracer("test-tracer"),
    cleanup: () => provider.shutdown(),
  };
}

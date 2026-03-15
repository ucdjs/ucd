import mermaid from "mermaid";
import { useEffect, useRef, useState } from "react";

let isInitialized = false;

function ensureMermaidInitialized() {
  if (!isInitialized) {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme: "neutral",
    });
    isInitialized = true;
  }
}

function createDiagramId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `mermaid-diagram-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export interface MermaidProps {
  chart: string;
}

export function Mermaid({ chart }: MermaidProps) {
  const diagramRef = useRef<HTMLDivElement>(null);
  const renderVersionRef = useRef(0);
  const [diagramId] = useState(createDiagramId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const node = diagramRef.current;

    if (!node) {
      return;
    }

    const currentNode = node;
    let isDisposed = false;
    const currentRender = ++renderVersionRef.current;

    async function renderDiagram() {
      try {
        setError(null);
        ensureMermaidInitialized();

        if (isDisposed || currentRender !== renderVersionRef.current) {
          return;
        }

        const { bindFunctions, svg } = await mermaid.render(`${diagramId}-${currentRender}`, chart);

        if (isDisposed || currentRender !== renderVersionRef.current) {
          return;
        }

        const parsed = new DOMParser().parseFromString(svg, "image/svg+xml");
        const svgNode = parsed.documentElement;

        currentNode.replaceChildren(document.importNode(svgNode, true));
        bindFunctions?.(currentNode);
      } catch (err) {
        if (isDisposed || currentRender !== renderVersionRef.current) {
          return;
        }

        currentNode.replaceChildren();
        setError(err instanceof Error ? err.message : "Diagram rendering failed.");
      }
    }

    void renderDiagram();

    return () => {
      isDisposed = true;
      currentNode.replaceChildren();
    };
  }, [chart, diagramId]);

  if (error) {
    return (
      <div className="my-4 space-y-2">
        <p className="text-sm text-red-600">
          Failed to render Mermaid diagram:
          {" "}
          {error}
        </p>
        <pre className="overflow-x-auto rounded-lg border p-4">
          <code>{chart}</code>
        </pre>
      </div>
    );
  }

  return (
    <div ref={diagramRef} aria-label="Mermaid diagram" className="my-4 overflow-x-auto" />
  );
}

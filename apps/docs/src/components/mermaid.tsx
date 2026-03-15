import mermaid from "mermaid";
import { useEffect, useRef } from "react";

let isInitialized = false;

export interface MermaidProps {
  chart: string;
}

export function Mermaid({ chart }: MermaidProps) {
  const ref = useRef<HTMLPreElement>(null);

  useEffect(() => {
    const node = ref.current;

    if (!node) {
      return;
    }

    if (!isInitialized) {
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        theme: "neutral",
      });
      isInitialized = true;
    }

    node.removeAttribute("data-processed");
    node.textContent = chart;

    void mermaid.run({
      nodes: [node],
    });
  }, [chart]);

  return (
    <div className="my-4 overflow-x-auto">
      <pre ref={ref} className="mermaid">
        {chart}
      </pre>
    </div>
  );
}

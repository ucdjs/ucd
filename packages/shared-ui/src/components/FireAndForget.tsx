import * as React from "react";
import { memo, useLayoutEffect, useRef } from "react";

interface StaticCodeBlockProps {
  highlightedHtml: string;
}

export const StaticCodeBlock = memo(({ highlightedHtml }: StaticCodeBlockProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (containerRef.current) {
      // Direct DOM manipulation is much cheaper than React's reconciliation
      containerRef.current.innerHTML = highlightedHtml;
    }

    // Cleanup to help Garbage Collection when component unmounts
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [highlightedHtml]);

  return (
    <div
      ref={containerRef}
      className="shiki-container"
      // We explicitly tell React this subtree is managed externally
      suppressHydrationWarning={true}
    />
  );
});

StaticCodeBlock.displayName = "StaticCodeBlock";

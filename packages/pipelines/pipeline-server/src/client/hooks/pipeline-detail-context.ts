import type { PipelineDetailContextValue } from "../types";
import { createContext, use } from "react";

export const PipelineDetailContext = createContext<PipelineDetailContextValue | null>(null);

export function usePipelineDetailContext(): PipelineDetailContextValue {
  const ctx = use(PipelineDetailContext);
  if (!ctx) {
    throw new Error("usePipelineDetailContext must be used within PipelineDetailLayout");
  }
  return ctx;
}

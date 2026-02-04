import type { PipelinesContextValue } from "../types";
import { createContext, use } from "react";

export const PipelinesContext = createContext<PipelinesContextValue | null>(null);

export function usePipelinesContext(): PipelinesContextValue {
  const ctx = use(PipelinesContext);
  if (!ctx) {
    throw new Error("usePipelinesContext must be used within PipelinesProvider");
  }
  return ctx;
}

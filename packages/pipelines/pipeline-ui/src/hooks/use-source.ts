import { sourceQueryOptions } from "../functions/source";
import { useQuery } from "@tanstack/react-query";

export function useSource(sourceId: string) {
  return useQuery(sourceQueryOptions(sourceId));
}

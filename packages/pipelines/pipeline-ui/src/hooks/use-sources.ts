import { sourcesQueryOptions } from "../functions/sources";
import { useQuery } from "@tanstack/react-query";

export function useSources() {
  return useQuery(sourcesQueryOptions());
}

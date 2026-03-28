type RouteDependency = `route:${string}`;

export type PipelineDependency = RouteDependency;

export interface ParsedRouteDependency {
  type: "route";
  routeId: string;
}

export type ParsedDependency = ParsedRouteDependency;

export type ParseDependencyType<T extends string>
  = T extends `route:${infer RouteId}`
    ? { type: "route"; routeId: RouteId }
    : never;

export type ExtractRouteDependencies<T extends readonly PipelineDependency[]> = {
  [K in keyof T]: T[K] extends `route:${infer RouteId}` ? RouteId : never;
}[number];

export function parseDependency(dep: PipelineDependency): ParsedDependency {
  if (dep.startsWith("route:")) {
    const routeId = dep.slice("route:".length);
    if (!routeId) {
      throw new Error(`Invalid route dependency format: ${dep}. Expected "route:<id>" with non-empty id`);
    }
    return { type: "route", routeId };
  }

  throw new Error(`Invalid dependency format: ${dep}. Expected "route:<id>"`);
}

export function isRouteDependency(dep: PipelineDependency): dep is RouteDependency {
  return dep.startsWith("route:");
}

export function createRouteDependency(routeId: string): RouteDependency {
  return `route:${routeId}`;
}

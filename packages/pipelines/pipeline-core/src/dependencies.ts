type RouteDependency = `route:${string}`;
type ArtifactDependency = `artifact:${string}:${string}`;

export type PipelineDependency = RouteDependency | ArtifactDependency;

export interface ParsedRouteDependency {
  type: "route";
  routeId: string;
}

export interface ParsedArtifactDependency {
  type: "artifact";
  routeId: string;
  artifactName: string;
}

export type ParsedDependency = ParsedRouteDependency | ParsedArtifactDependency;

export type ParseDependencyType<T extends string>
  = T extends `route:${infer RouteId}`
    ? { type: "route"; routeId: RouteId }
    : T extends `artifact:${infer RouteId}:${infer ArtifactName}`
      ? { type: "artifact"; routeId: RouteId; artifactName: ArtifactName }
      : never;

export type ExtractRouteDependencies<T extends readonly PipelineDependency[]> = {
  [K in keyof T]: T[K] extends `route:${infer RouteId}` ? RouteId : never;
}[number];

export type ExtractArtifactDependencies<T extends readonly PipelineDependency[]> = {
  [K in keyof T]: T[K] extends `artifact:${infer RouteId}:${infer ArtifactName}`
    ? { routeId: RouteId; artifactName: ArtifactName }
    : never;
}[number];

export type ExtractArtifactKeys<T extends readonly PipelineDependency[]> = {
  [K in keyof T]: T[K] extends `artifact:${infer RouteId}:${infer ArtifactName}`
    ? `${RouteId}:${ArtifactName}`
    : never;
}[number];

export function parseDependency(dep: PipelineDependency): ParsedDependency {
  if (dep.startsWith("route:")) {
    return { type: "route", routeId: dep.slice("route:".length) };
  }

  if (dep.startsWith("artifact:")) {
    const rest = dep.slice("artifact:".length);
    const sepIndex = rest.indexOf(":");
    if (sepIndex <= 0 || sepIndex >= rest.length - 1) {
      throw new Error(`Invalid artifact dependency format: ${dep}. Expected "artifact:<routeId>:<artifactName>" with non-empty parts`);
    }

    return {
      type: "artifact",
      routeId: rest.slice(0, sepIndex),
      artifactName: rest.slice(sepIndex + 1),
    };
  }

  throw new Error(`Invalid dependency format: ${dep}. Expected "route:<id>" or "artifact:<routeId>:<artifactName>"`);
}

export function isRouteDependency(dep: PipelineDependency): dep is RouteDependency {
  return dep.startsWith("route:");
}

export function isArtifactDependency(dep: PipelineDependency): dep is ArtifactDependency {
  return dep.startsWith("artifact:");
}

export function createRouteDependency(routeId: string): RouteDependency {
  return `route:${routeId}`;
}

export function createArtifactDependency(routeId: string, artifactName: string): ArtifactDependency {
  return `artifact:${routeId}:${artifactName}`;
}

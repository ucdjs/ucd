export type WorkerEnvironmentName
  = | "production"
    | "preview"
    | "local"
    | "testing"
    | (string & {});

export function getApiOriginForEnvironment(environment: WorkerEnvironmentName | undefined): string {
  if (environment === "production") {
    return "https://api.ucdjs.dev";
  }

  if (environment === "preview") {
    return "https://preview.api.ucdjs.dev";
  }

  return "http://localhost:8787";
}

export function getOriginsForEnvironment(environment: WorkerEnvironmentName | undefined): string[] {
  if (environment === "local") {
    return ["http://localhost:3000", "http://localhost:8787"];
  }

  const origins = ["https://ucdjs.dev", "https://www.ucdjs.dev"];

  if (environment === "preview") {
    origins.push("https://preview.api.ucdjs.dev", "https://preview.unicode-proxy.ucdjs.dev");
  }

  return origins;
}

export function getStoreOriginForEnvironment(environment: WorkerEnvironmentName | undefined): string {
  if (environment === "production") {
    return "https://ucd-store.ucdjs.dev";
  }

  if (environment === "preview") {
    return "https://preview.ucd-store.ucdjs.dev";
  }

  return "http://ucd-store.localhost:8787";
}

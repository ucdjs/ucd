export type WorkerEnvironmentName =
  | "production"
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

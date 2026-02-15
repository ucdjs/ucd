export function isStoreSubdomainHostname(hostname: string): boolean {
  return hostname === "ucd-store.ucdjs.dev"
    || hostname === "preview.ucd-store.ucdjs.dev"
    || hostname === "ucd-store.localhost";
}

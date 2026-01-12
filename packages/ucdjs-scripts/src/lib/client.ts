import { createUCDClient } from "@ucdjs/client";

let cachedBaseUrl: string | undefined;
let cachedClient: Awaited<ReturnType<typeof createUCDClient>> | null = null;

export async function getClient(baseUrl: string) {
  if (cachedClient && cachedBaseUrl === baseUrl) {
    return cachedClient;
  }

  cachedBaseUrl = baseUrl;
  cachedClient = await createUCDClient(baseUrl);
  return cachedClient;
}

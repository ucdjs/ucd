import type { SetupServerApi } from "msw/node";
import { createMockFetch } from "@luxass/msw-utils";
import { setupServer } from "msw/node";

declare global {
  // eslint-disable-next-line vars-on-top
  var __ucd_msw_server: SetupServerApi | undefined;
}

export { createMockFetch } from "@luxass/msw-utils";
export { bypass, http, HttpResponse, passthrough } from "msw";

export const mswServer = setupServer();
globalThis.__ucd_msw_server = mswServer;

export const mockFetch = createMockFetch({
  mswServer,
  replaceOpenAPIPathParams: true,
});

/**
 * A `Response` subclass that avoids default headers.
 * Useful for MSW or unit tests to simulate "naked" responses from a server
 * that lack a `Content-Type` header, allowing you to test fallback parsing logic.
 */
export class RawResponse extends Response {
  /**
   * @param {BodyInit | null} body - The body of the response.
   * @param {ResponseInit} [init] - Options including status code and headers.
   */
  constructor(body?: BodyInit | null, init?: ResponseInit) {
    let processedBody = body;

    // Convert string body to binary to prevent default Content-Type header
    if (typeof body === "string") {
      processedBody = new TextEncoder().encode(body);
    }

    super(processedBody, init);
  }
}

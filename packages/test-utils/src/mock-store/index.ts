import type { JsonBodyType } from "msw";
import type { MockStoreConfig, MockStoreFiles, MockStoreNodeWithPath } from "./types";
import { createDebugger, findFileByPath, isApiError } from "@ucdjs-internal/shared";
import {
  UCD_STAT_CHILDREN_DIRS_HEADER,
  UCD_STAT_CHILDREN_FILES_HEADER,
  UCD_STAT_CHILDREN_HEADER,
  UCD_STAT_SIZE_HEADER,
  UCD_STAT_TYPE_HEADER,
} from "@ucdjs/env";
import { HttpResponse } from "msw";
import { mockFetch } from "../msw";
import { addPathsToFileNodes } from "./add-paths";
import { defaultArabicShapingFileContent } from "./default-files/arabic-shaping";
import { defaultBidiBracketsFileContent } from "./default-files/bidi-brackets";
import { defaultDerivedBidClassFileContent } from "./default-files/derived-bidi-class";
import { MOCK_ROUTES } from "./handlers";

import {
  extractConfiguredMetadata,
  omitChildrenAndContent,
  parseLatency,
  wrapMockFetch,
} from "./utils";

const debug = createDebugger("ucdjs:test-utils:mock-store");

const DEFAULT_MOCK_STORE_FILES = {
  "*": [
    {
      type: "file",
      name: "ArabicShaping.txt",
      lastModified: 1755287100000,
      _content: defaultArabicShapingFileContent,
    },
    {
      type: "file",
      name: "BidiBrackets.txt",
      lastModified: 1755287100000,
      _content: defaultBidiBracketsFileContent,
    },
    {
      type: "directory",
      name: "extracted",
      lastModified: 1755287100000,
      children: [
        {
          type: "file",
          name: "DerivedBidiClass.txt",
          lastModified: 1755287100000,
          _content: defaultDerivedBidClassFileContent,
        },
      ],
    },
  ],
} satisfies MockStoreFiles;

export function mockStoreApi(config?: MockStoreConfig): void {
  const {
    baseUrl = "https://api.ucdjs.dev",
    responses,
    versions = ["16.0.0", "15.1.0", "15.0.0"],
    customResponses = [],
    onRequest,
    files = DEFAULT_MOCK_STORE_FILES,
  } = config || {};

  debug?.("Setting up mock store API with config:", config);

  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;

  for (const route of MOCK_ROUTES) {
    const endpoint = route.endpoint;

    // Every endpoint is optional, but by default enabled
    const response = responses?.[endpoint as keyof typeof responses] ?? false;

    // If explicitly disabled, skip
    if (response === false) continue;

    // extract metadata from configure
    let { actualResponse, latency, headers, beforeHook, afterHook } = extractConfiguredMetadata(response);

    // Normalize wrapped true object back to true for handlers
    if (typeof actualResponse === "object" && actualResponse !== null && "__useDefaultResolver" in actualResponse) {
      actualResponse = true;
    }

    // Check if we should use default value (true or null)
    const shouldUseDefaultValue = actualResponse === true || response == null;
    debug?.(`Setting up mock for endpoint: ${endpoint} with response:`, actualResponse);

    if (isApiError(actualResponse)) {
      debug?.(`Detected ApiError-like response for endpoint: ${endpoint}`);
      // If the configured response is an error, short-circuit here
      // This prevents issues where we return an error object to a resolver
      // that doesn't get transformed into an actual error response
      // eslint-disable-next-line prefer-const
      let tmp = actualResponse;
      function newHandler(): HttpResponse<JsonBodyType> {
        return HttpResponse.json(tmp as any, {
          status: (tmp as any).status,
        });
      }
      actualResponse = newHandler;
    }

    const wrappedMockFetch = wrapMockFetch(mockFetch, {
      onRequest,
      beforeFetch: async (payload) => {
        debug?.("Before fetch for endpoint:", endpoint);
        // apply latency before calling resolver
        if (latency) {
          const ms = parseLatency(latency);
          await new Promise((resolve) => setTimeout(resolve, ms));
        }
        // call before hook if configured
        await beforeHook?.(payload);
      },
      afterFetch: async ({ response, ...payload }) => {
        debug?.("After fetch for endpoint:", endpoint);
        // call after hook if configured
        await afterHook?.({ ...payload, response });

        if (!response) {
          debug?.("No response returned from resolver");
          return;
        }

        if (
          !headers
          || !("headers" in response)
          || !(response.headers instanceof Headers)
        ) {
          return;
        }

        for (const [key, value] of Object.entries(headers)) {
          const current = response.headers.get(key);
          if (current !== value) response.headers.set(key, value);
        }
      },
    });

    const mswPath = toMSWPath(endpoint);
    debug?.(`MSW path for endpoint ${endpoint}: ${mswPath}`);

    route.setup({
      url: `${normalizedBaseUrl}${mswPath}`,
      // TypeScript cannot infer that `endpoint` is always a key of `responses` here,
      // because `endpoint` comes from MOCK_ROUTES and `responses` is user-provided.
      // We assert the type here because we know from the context that `endpoint` is intended
      // to match the keys of `responses`, and `actualResponse` is the value for that key.
      providedResponse: actualResponse as any,
      shouldUseDefaultValue,
      mockFetch: wrappedMockFetch,
      versions,
      files,
    });
  }

  if (customResponses.length > 0) {
    debug?.("Setting up custom responses");
    mockFetch(customResponses);
  }
}

function toMSWPath(endpoint: string): string {
  return endpoint.replace(/\{(\w+)\}/g, (_, p1) => {
    // This plays nicely with the change we made
    // for :wildcard* in our wrap mock fetch logic
    // https://github.com/ucdjs/ucd/blob/c662bec8429c98e5fd98942e2c12f0e6fd479d51/packages/test-utils/src/mock-store/utils.ts#L94-L105
    if (p1 === "wildcard") {
      return `:${p1}*`;
    }

    return `:${p1}`;
  });
}

/**
 * Sets up mock handlers for the store subdomain (ucd-store.ucdjs.dev).
 *
 * This is used for the HTTP fs-bridge which directly accesses files via the store subdomain
 * rather than through the API. The store subdomain handles paths like /:version/:filepath
 * without the /ucd/ prefix (it's handled internally by the subdomain).
 *
 * @param {object} config - Configuration for the store subdomain mock
 * @param {string} [config.storeBaseUrl] - Base URL for the store subdomain (defaults to https://ucd-store.ucdjs.dev)
 * @param {MockStoreFiles} config.files - The files to mock
 */
export function mockStoreSubdomain(config: {
  storeBaseUrl?: string;
  files: MockStoreFiles;
}): void {
  const {
    storeBaseUrl = "https://ucd-store.ucdjs.dev",
    files,
  } = config;

  debug?.("Setting up mock store subdomain with config:", config);

  const normalizedStoreBaseUrl = storeBaseUrl.endsWith("/") ? storeBaseUrl.slice(0, -1) : storeBaseUrl;

  // Set up a catch-all handler for the store subdomain
  // This handles requests like /:version/:filepath
  mockFetch([
    [["GET", "HEAD"], `${normalizedStoreBaseUrl}/:wildcard*`, ({ request, params }) => {
      const wildcard = (params.wildcard as string) || "";
      const isHeadRequest = request.method === "HEAD";

      debug?.("Store subdomain request:", { wildcard, method: request.method });

      // Parse the path: version/filepath (no /ucd/ prefix - handled internally)
      const [firstPart, ...pathParts] = wildcard.split("/");

      // Check if the first part is a valid version key in files
      const isVersionKey = firstPart && firstPart in files;

      let version = "";
      let filePath: string;
      let versionFiles: MockStoreNodeWithPath[] = [];
      let lookupPath: string;

      if (isVersionKey || (firstPart && files["*"])) {
        version = firstPart;
        filePath = pathParts.join("/");
        const versionFilesRaw = files[firstPart] || files["*"];

        if (!versionFilesRaw || !Array.isArray(versionFilesRaw)) {
          return HttpResponse.json({
            message: "Resource not found",
            status: 404,
            timestamp: new Date().toISOString(),
          }, { status: 404 });
        }

        // Build file tree with version-prefixed paths but NO "ucd" subdirectory
        // The store subdomain handles /ucd/ internally, so paths are like /16.0.0/UnicodeData.txt
        versionFiles = addPathsToFileNodes(versionFilesRaw, version, "");
        lookupPath = filePath ? `/${version}/${filePath}` : `/${version}`;
      } else {
        filePath = wildcard;
        const rootFilesRaw = files.root;

        if (!rootFilesRaw || !Array.isArray(rootFilesRaw)) {
          return HttpResponse.json({
            message: "Resource not found",
            status: 404,
            timestamp: new Date().toISOString(),
          }, { status: 404 });
        }

        versionFiles = addPathsToFileNodes(rootFilesRaw, "", "");
        lookupPath = filePath ? `/${filePath}` : "/";
      }

      debug?.("Looking up path:", { lookupPath, versionFilesCount: versionFiles.length });

      // If requesting just the version root, return the directory listing
      if (version && !filePath) {
        const stripped = omitChildrenAndContent(versionFiles);
        return HttpResponse.json(stripped, {
          headers: {
            [UCD_STAT_TYPE_HEADER]: "directory",
            [UCD_STAT_CHILDREN_HEADER]: `${stripped.length}`,
            [UCD_STAT_CHILDREN_FILES_HEADER]: `${stripped.filter((f) => f.type === "file").length}`,
            [UCD_STAT_CHILDREN_DIRS_HEADER]: `${stripped.filter((f) => f.type === "directory").length}`,
          },
        });
      }

      // Locate the requested file or directory within the tree
      const fileNode = findFileByPath(versionFiles, lookupPath);

      // If it's a directory, return its children (or empty array)
      if (fileNode && fileNode.type === "directory") {
        const stripped = omitChildrenAndContent(fileNode.children ?? []);
        return HttpResponse.json(stripped, {
          headers: {
            [UCD_STAT_TYPE_HEADER]: "directory",
            [UCD_STAT_CHILDREN_HEADER]: `${stripped.length}`,
            [UCD_STAT_CHILDREN_FILES_HEADER]: `${stripped.filter((f) => f.type === "file").length}`,
            [UCD_STAT_CHILDREN_DIRS_HEADER]: `${stripped.filter((f) => f.type === "directory").length}`,
          },
        });
      }

      // If it's a file with _content, return the content
      if (fileNode && "_content" in fileNode && typeof fileNode._content === "string") {
        const content = fileNode._content;
        const contentLength = new TextEncoder().encode(content).length;
        const headers: Record<string, string> = {
          "Content-Type": "text/plain; charset=utf-8",
          [UCD_STAT_TYPE_HEADER]: "file",
        };

        // Only include size headers for HEAD requests (buffered response)
        if (isHeadRequest) {
          headers["Content-Length"] = `${contentLength}`;
          headers[UCD_STAT_SIZE_HEADER] = `${contentLength}`;
        }

        return HttpResponse.text(content, { headers });
      }

      // If file found but no _content, return the filename
      if (fileNode) {
        console.warn(`Mock store subdomain: File "${filePath}" found but has no _content. Returning 404.`);
        return HttpResponse.json({
          message: "Resource not found",
          status: 404,
          timestamp: new Date().toISOString(),
        }, { status: 404 });
      }

      return HttpResponse.json({
        message: "Resource not found",
        status: 404,
        timestamp: new Date().toISOString(),
      }, { status: 404 });
    }],
  ]);
}

export type { MockStoreConfig };
export { createFileTree } from "./file-tree";
export type { FileTreeInput, FileTreeNodeWithContent } from "./file-tree";
export { configure, unsafeResponse } from "./helpers";

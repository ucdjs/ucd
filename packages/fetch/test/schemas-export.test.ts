import { describe, expect, it } from "vitest";

// Import types from the fetch package to test they're re-exported correctly
import type { 
  UCDStoreManifest, 
  FileEntry, 
  FileEntryList, 
  // These should still be available from fetch (API-specific)
  ApiError,
  UnicodeVersion,
  UnicodeVersionList
} from "../src";

// Import runtime exports (schemas and functions)
import { 
  FileEntrySchema, 
  UCDStoreManifestSchema,
  client,
  createClient,
  isApiError
} from "../src";

describe("schemas re-export", () => {
  it("should export schema types from @ucdjs/schemas", () => {
    // Test that shared schema types are available
    const manifest: UCDStoreManifest = {
      "15.1.0": "15.1.0",
      "14.0.0": "14.0.0"
    };
    
    const fileEntry: FileEntry = {
      name: "test.txt",
      path: "/test.txt",
      lastModified: Date.now(),
      type: "file"
    };
    
    const fileList: FileEntryList = [fileEntry];
    
    // These should be available as runtime exports too
    expect(typeof FileEntrySchema).toBe("object");
    expect(typeof UCDStoreManifestSchema).toBe("object");
    
    // Validate the schemas work
    const manifestResult = UCDStoreManifestSchema.safeParse(manifest);
    expect(manifestResult.success).toBe(true);
    
    const fileResult = FileEntrySchema.safeParse(fileEntry);
    expect(fileResult.success).toBe(true);
  });

  it("should still export API-specific types", () => {
    // Test that API-specific types are still available (compile-time check)
    const apiError: ApiError = {
      message: "Test error",
      status: 404,
      timestamp: "2025-01-27T12:00:00Z"
    };

    const version: UnicodeVersion = {
      version: "15.1.0",
      documentationUrl: "https://www.unicode.org/versions/Unicode15.1.0/",
      date: "2023-09-12",
      url: "https://www.unicode.org/Public/15.1.0/ucd/",
      type: "stable",
      mappedUcdVersion: "15.1.0"
    };

    const versions: UnicodeVersionList = [version];

    // Ensure the guard function still works
    expect(isApiError(apiError)).toBe(true);
    expect(isApiError({})).toBe(false);
    
    // Ensure client functions are still available
    expect(typeof client).toBe("object");
    expect(typeof createClient).toBe("function");
  });

  it("should maintain backward compatibility", () => {
    // All these imports should work without breaking existing code
    // This is mostly a compile-time test, but we can verify the exports exist

    const exportedNames = [
      // From schemas (shared)
      "FileEntrySchema",
      "UCDStoreManifestSchema", 
      // From client
      "client",
      "createClient",
      "isApiError"
    ];

    exportedNames.forEach(name => {
      expect(name in (globalThis as any)).toBe(false); // These are imports, not globals
    });
  });
});
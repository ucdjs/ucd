import { describe, expect, it } from "vitest";

// Import types from the fetch package to test they're re-exported correctly
import type { 
  UCDStoreManifest, 
  FileEntry, 
  FileEntryList, 
  FileEntrySchema, 
  UCDStoreManifestSchema 
} from "../src";

describe("schemas re-export", () => {
  it("should export schema types from @ucdjs/schemas", () => {
    // Test that types are available (this is a compile-time test)
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
});
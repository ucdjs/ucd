import type { GeneratedManifest } from "../src/types";
import { describe, expect, it } from "vitest";
import { createManifestEtag } from "../src/lib/manifest";

function createGeneratedManifest(): GeneratedManifest {
  return {
    version: "16.0.0",
    manifest: {
      expectedFiles: [
        {
          name: "UnicodeData.txt",
          path: "/16.0.0/ucd/UnicodeData.txt",
          storePath: "/16.0.0/UnicodeData.txt",
        },
      ],
    },
    snapshot: {
      unicodeVersion: "16.0.0",
      files: {
        "UnicodeData.txt": {
          hash: "sha256:1111111111111111111111111111111111111111111111111111111111111111",
          fileHash: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          size: 123,
        },
      },
    },
    fileCount: 1,
  };
}

describe("createManifestEtag", () => {
  it("should change when snapshot content changes", () => {
    const first = createGeneratedManifest();
    const second = createGeneratedManifest();

    second.snapshot.files["UnicodeData.txt"] = {
      hash: "sha256:2222222222222222222222222222222222222222222222222222222222222222",
      fileHash: "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      size: 456,
    };

    expect(createManifestEtag(first)).not.toBe(createManifestEtag(second));
  });

  it("should remain stable for identical manifest and snapshot content", () => {
    const first = createGeneratedManifest();
    const second = createGeneratedManifest();

    expect(createManifestEtag(first)).toBe(createManifestEtag(second));
  });
});

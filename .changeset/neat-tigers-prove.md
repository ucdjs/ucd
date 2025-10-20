---
"@ucdjs/test-utils": minor
---

Add in-memory file system bridge for testing

Introduces `createMemoryMockFS` under `@ucdjs/test-utils/fs-bridges` - a lightweight, Map-based in-memory file system bridge for testing file operations without real I/O.

**Usage:**

```typescript
import { describe, it, expect } from "vitest";
import { createMemoryMockFS } from "@ucdjs/test-utils/fs-bridges";

describe("file operations", () => {
  it("should read and write files", async () => {
    const fs = createMemoryMockFS();

    await fs.write("test.txt", "content");
    const content = await fs.read("test.txt");

    expect(content).toBe("content");
  });

  it("should initialize with pre-populated files", async () => {
    const fs = createMemoryMockFS({
      initialFiles: {
        "manifest.json": JSON.stringify({ versions: ["16.0.0"] }),
        "16.0.0/UnicodeData.txt": "0000;<control>;Cc;0;BN;;;;;N;NULL;;;;",
      }
    });

    expect(await fs.exists("manifest.json")).toBe(true);
    expect(await fs.exists("16.0.0/UnicodeData.txt")).toBe(true);
  });
});
```

Supports all file system operations: `read`, `write`, `exists`, `listdir`, `mkdir`, `rm`. Full write/read/mkdir/rm capabilities included.

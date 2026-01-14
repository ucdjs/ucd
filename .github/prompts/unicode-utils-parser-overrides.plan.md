# Task: Implement Parser Override System for unicode-utils

## Context

You are working on the `unicode-utils` repository (https://github.com/luxass/unicode-utils), a monorepo for parsing Unicode Character Database (UCD) files. The project uses:

- **pnpm workspaces** with **Turbo** for build orchestration
- **TypeScript** with **tsdown** for building
- **Vitest** for testing
- **Zod** (already in dependencies via catalog) for schema validation
- **defu** for deep object merging

### Current Architecture

The parser package (`packages/parser`) has an AST-based parsing system:

**Node Types** (`packages/parser/src/datafile/ast.ts`):
- ROOT, COMMENT, EMPTY_COMMENT, BOUNDARY, DATA, EMPTY, EOF, PROPERTY, UNKNOWN

**Existing Settings System** (`packages/parser/src/inference/heading-settings.ts`):
- `HEADING_SETTINGS_CONFIG` array (currently empty)
- `DataFileSettingsEntry` interface with `fileName`, `version`, `settings`
- `getHeadingSettings(fileName, version)` function

**Settings Interface** (`packages/parser/src/inference/heading.ts`):
- `InferHeadingSettings` with `allowEmptyLines` and `allowMultipleBoundaries` options
- `inferHeadingFromAST(root, settings)` function that auto-detects headings

**The Problem**: Some UCD files have unusual structures that cause the heading inference algorithm to fail. We need explicit overrides for specific files in specific Unicode versions.

## Requirements

### 1. Create Override File Structure

Create a directory for JSON override files:

```
packages/parser/
├── src/
│   └── overrides/
│       ├── schema.ts      # Zod schemas
│       ├── loader.ts      # Load overrides from filesystem
│       ├── registry.ts    # In-memory registry for bundled/browser use
│       └── index.ts       # Public exports
├── overrides/             # Actual override JSON files
│   ├── v16.0.0/
│   │   └── UnicodeData.json
│   ├── v15.1.0/
│   │   └── SomeFile.json
│   └── ...
```

### 2. Define Zod Schema

Create `packages/parser/src/overrides/schema.ts`:

```typescript
import { z } from "zod";

export const PositionSchema = z.object({
  start: z.number().int().min(0),
  end: z.number().int().min(0),
}).refine(
  (data) => data.end >= data.start,
  { message: "end must be >= start" }
);

export const HeadingOverrideSchema = z.object({
  // Existing settings from InferHeadingSettings
  allowEmptyLines: z.boolean().optional(),
  allowMultipleBoundaries: z.boolean().optional(),
  
  // NEW: Explicit position (0-indexed line numbers, both required if specified)
  position: PositionSchema.optional(),
});

export const ParserOverrideSchema = z.object({
  // Schema version for future compatibility
  $schema: z.string().optional(),
  version: z.literal(1),
  
  // The file this override applies to
  fileName: z.string(),
  unicodeVersion: z.string(),
  
  // Heading configuration
  heading: HeadingOverrideSchema.optional(),
});

export type ParserOverride = z.infer<typeof ParserOverrideSchema>;
export type HeadingOverride = z.infer<typeof HeadingOverrideSchema>;
export type Position = z.infer<typeof PositionSchema>;
```

### 3. Create Override Registry

Create `packages/parser/src/overrides/registry.ts` for in-memory storage (works in browser):

```typescript
import type { ParserOverride } from "./schema";
import { ParserOverrideSchema } from "./schema";

const overrideRegistry = new Map<string, ParserOverride>();

function getKey(fileName: string, unicodeVersion: string): string {
  return `${unicodeVersion}/${fileName}`;
}

export function registerOverride(override: ParserOverride): void {
  const validated = ParserOverrideSchema.parse(override);
  const key = getKey(validated.fileName, validated.unicodeVersion);
  overrideRegistry.set(key, validated);
}

export function getOverride(fileName: string, unicodeVersion: string): ParserOverride | null {
  const key = getKey(fileName, unicodeVersion);
  return overrideRegistry.get(key) ?? null;
}

export function clearOverrides(): void {
  overrideRegistry.clear();
}

export function getAllOverrides(): ParserOverride[] {
  return Array.from(overrideRegistry.values());
}
```

### 4. Create Override Loader (Node.js)

Create `packages/parser/src/overrides/loader.ts` for filesystem loading:

```typescript
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { ParserOverride } from "./schema";
import { ParserOverrideSchema } from "./schema";
import { registerOverride, getOverride as getFromRegistry } from "./registry";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OVERRIDES_DIR = join(__dirname, "../../overrides");

let loaded = false;

export function loadOverridesFromFilesystem(): void {
  if (loaded) return;
  
  // Implementation: read all JSON files from overrides/<version>/<file>.json
  // Validate with Zod and register in memory
  // Handle errors gracefully (log warning, continue)
  
  loaded = true;
}

export function loadOverride(fileName: string, unicodeVersion: string): ParserOverride | null {
  // First check registry
  const existing = getFromRegistry(fileName, unicodeVersion);
  if (existing) return existing;
  
  // Try to load from filesystem
  const filePath = join(OVERRIDES_DIR, unicodeVersion, `${fileName}.json`);
  if (!existsSync(filePath)) return null;
  
  try {
    const content = readFileSync(filePath, "utf-8");
    const data = JSON.parse(content);
    const validated = ParserOverrideSchema.parse(data);
    registerOverride(validated);
    return validated;
  } catch (error) {
    console.warn(`Failed to load override from ${filePath}:`, error);
    return null;
  }
}

// Re-export for convenience
export { getOverride } from "./registry";
```

### 5. Integrate with Heading Inference

Modify `packages/parser/src/inference/heading.ts`:

```typescript
import { defu } from "defu";
import { getOverride } from "../overrides/registry";
import { loadOverride } from "../overrides/loader";
import { getHeadingSettings } from "./heading-settings";

export function inferHeadingFromAST(
  root: RootNode,
  settings?: InferHeadingSettings,
): string | null {
  // 1. Try to get override for this file/version
  let override = getOverride(root.fileName, root.version);
  
  // 2. If not in registry, try loading from filesystem (Node.js only)
  if (!override && typeof loadOverride === "function") {
    try {
      override = loadOverride(root.fileName, root.version);
    } catch {
      // Ignore - might be in browser environment
    }
  }
  
  // 3. If override has explicit position, use it directly (skip inference)
  if (override?.heading?.position) {
    const { start, end } = override.heading.position;
    return extractLinesFromContent(root.raw, start, end);
  }
  
  // 4. Otherwise, use existing inference with merged settings
  const mergedSettings = defu(
    settings ?? {},
    override?.heading ?? {},
    getHeadingSettings(root.fileName, root.version) ?? {},
    {
      allowEmptyLines: true,
      allowMultipleBoundaries: true,
    },
  );
  
  // ... existing inference logic continues here
}

function extractLinesFromContent(content: string, start: number, end: number): string {
  const lines = content.split("\n");
  // start and end are 0-indexed, inclusive
  const selectedLines = lines.slice(start, end + 1);
  return selectedLines.join("\n");
}
```

### 6. Update Exports

Update `packages/parser/src/index.ts` to export the new types and functions:

```typescript
// Existing exports...

// Override system
export {
  ParserOverrideSchema,
  HeadingOverrideSchema,
  PositionSchema,
  type ParserOverride,
  type HeadingOverride,
  type Position,
} from "./overrides/schema";

export {
  registerOverride,
  getOverride,
  clearOverrides,
  getAllOverrides,
} from "./overrides/registry";

// Conditionally export loader (Node.js only)
export { loadOverride, loadOverridesFromFilesystem } from "./overrides/loader";
```

### 7. Deprecate HEADING_SETTINGS_CONFIG

Update `packages/parser/src/inference/heading-settings.ts`:

```typescript
/**
 * @deprecated Use JSON override files in `overrides/<version>/<fileName>.json` instead.
 * This config is kept for backwards compatibility but has lower priority than JSON overrides.
 * 
 * To migrate:
 * 1. Create `overrides/<version>/<fileName>.json`
 * 2. Use the ParserOverride schema format
 * 3. Remove the entry from this array
 */
export const HEADING_SETTINGS_CONFIG: DataFileSettingsEntry[] = [
  // Currently empty - keep for backwards compatibility
];
```

### 8. Add Tests

Create `packages/parser/test/overrides/`:

**`schema.test.ts`**:
```typescript
import { describe, it, expect } from "vitest";
import { ParserOverrideSchema, PositionSchema } from "../../src/overrides/schema";

describe("PositionSchema", () => {
  it("accepts valid position", () => {
    expect(() => PositionSchema.parse({ start: 0, end: 10 })).not.toThrow();
  });
  
  it("rejects end < start", () => {
    expect(() => PositionSchema.parse({ start: 10, end: 5 })).toThrow();
  });
  
  it("rejects negative values", () => {
    expect(() => PositionSchema.parse({ start: -1, end: 10 })).toThrow();
  });
});

describe("ParserOverrideSchema", () => {
  it("accepts valid override", () => {
    const override = {
      version: 1,
      fileName: "UnicodeData.txt",
      unicodeVersion: "16.0.0",
      heading: {
        position: { start: 0, end: 24 },
        allowEmptyLines: false,
      },
    };
    expect(() => ParserOverrideSchema.parse(override)).not.toThrow();
  });
  
  it("requires version to be 1", () => {
    const override = {
      version: 2,
      fileName: "Test.txt",
      unicodeVersion: "16.0.0",
    };
    expect(() => ParserOverrideSchema.parse(override)).toThrow();
  });
});
```

**`registry.test.ts`**:
```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { registerOverride, getOverride, clearOverrides } from "../../src/overrides/registry";

describe("Override Registry", () => {
  beforeEach(() => {
    clearOverrides();
  });
  
  it("registers and retrieves override", () => {
    const override = {
      version: 1 as const,
      fileName: "Test.txt",
      unicodeVersion: "16.0.0",
      heading: { position: { start: 0, end: 10 } },
    };
    
    registerOverride(override);
    
    const result = getOverride("Test.txt", "16.0.0");
    expect(result).toEqual(override);
  });
  
  it("returns null for non-existent override", () => {
    const result = getOverride("NonExistent.txt", "16.0.0");
    expect(result).toBeNull();
  });
});
```

**`integration.test.ts`**:
```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { parseDataFileIntoAst } from "../../src/datafile/parser";
import { inferHeadingFromAST } from "../../src/inference/heading";
import { registerOverride, clearOverrides } from "../../src/overrides/registry";

describe("Override Integration", () => {
  beforeEach(() => {
    clearOverrides();
  });
  
  it("uses explicit position from override", () => {
    const content = `# Line 0
# Line 1
# Line 2
# Line 3
0041;LATIN CAPITAL LETTER A;Lu;0;L;;;;;N;;;;0061`;
    
    // Register override with explicit position
    registerOverride({
      version: 1,
      fileName: "Test.txt",
      unicodeVersion: "16.0.0",
      heading: {
        position: { start: 0, end: 2 }, // Only lines 0-2
      },
    });
    
    const ast = parseDataFileIntoAst(content, "Test.txt");
    ast.version = "16.0.0"; // Set version for lookup
    
    const heading = inferHeadingFromAST(ast);
    
    expect(heading).toBe("# Line 0\n# Line 1\n# Line 2");
  });
});
```

### 9. Example Override File

Create `packages/parser/overrides/v16.0.0/UnicodeData.json`:

```json
{
  "$schema": "../../schemas/parser-override.schema.json",
  "version": 1,
  "fileName": "UnicodeData.txt",
  "unicodeVersion": "16.0.0",
  "heading": {
    "position": {
      "start": 0,
      "end": 0
    },
    "allowEmptyLines": false,
    "allowMultipleBoundaries": false
  }
}
```

### 10. Update package.json

Ensure `packages/parser/package.json` includes zod as a dependency:

```json
{
  "dependencies": {
    "defu": "catalog:build",
    "zod": "catalog:build"
  }
}
```

## Constraints

1. **No breaking changes** - Existing API must continue to work
2. **Tree-shakeable** - Override loading should be optional/lazy
3. **Works in browser** - Registry works without filesystem; loader is Node.js only
4. **Zod validation** - All overrides must be validated at load time
5. **Type-safe** - Full TypeScript types for all override structures
6. **0-indexed lines** - Both `start` and `end` are 0-indexed, inclusive

## Files to Create

- `packages/parser/src/overrides/schema.ts`
- `packages/parser/src/overrides/registry.ts`
- `packages/parser/src/overrides/loader.ts`
- `packages/parser/src/overrides/index.ts`
- `packages/parser/test/overrides/schema.test.ts`
- `packages/parser/test/overrides/registry.test.ts`
- `packages/parser/test/overrides/integration.test.ts`
- `packages/parser/overrides/.gitkeep` (or example override file)

## Files to Modify

- `packages/parser/src/inference/heading.ts` - Integrate override lookup
- `packages/parser/src/inference/heading-settings.ts` - Add deprecation notice
- `packages/parser/src/index.ts` - Export new types and functions
- `packages/parser/package.json` - Ensure dependencies are listed

## Success Criteria

1. Override files load and validate correctly with Zod
2. Explicit heading positions work (lines 0-24 extracts exactly those lines)
3. Settings merge correctly: override.heading > deprecated config > defaults
4. All existing tests still pass
5. New tests cover override functionality
6. Types are exported for external use (VS Code extension can import them)
7. Works in both Node.js and browser environments

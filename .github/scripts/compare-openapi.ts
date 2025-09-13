import { readFileSync, writeFileSync } from 'node:fs';

interface OpenAPISchema {
  paths?: Record<string, Record<string, any>>;
  components?: {
    schemas?: Record<string, any>;
  };
}

interface PathInfo {
  path: string;
  methods: string[];
}

interface ModifiedPathInfo {
  path: string;
  added: string[];
  removed: string[];
  existing: string[];
}

interface Changes {
  added: PathInfo[];
  removed: PathInfo[];
  modified: ModifiedPathInfo[];
  unchanged: PathInfo[];
}

function loadSchema(filePath: string): OpenAPISchema {
  try {
    const content = readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error loading schema from ${filePath}:`, error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

function extractPaths(schema: OpenAPISchema): Record<string, string[]> {
  const paths: Record<string, string[]> = {};
  if (schema.paths) {
    for (const [path, methods] of Object.entries(schema.paths)) {
      paths[path] = Object.keys(methods).filter(method =>
        ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'].includes(method.toLowerCase())
      );
    }
  }
  return paths;
}

function categorizeChanges(oldPaths: Record<string, string[]>, newPaths: Record<string, string[]>): Changes {
  const changes: Changes = {
    added: [],
    removed: [],
    modified: [],
    unchanged: []
  };

  const allPaths = new Set([...Object.keys(oldPaths), ...Object.keys(newPaths)]);

  for (const path of allPaths) {
    const oldMethods = oldPaths[path] || [];
    const newMethods = newPaths[path] || [];

    if (!oldMethods.length && newMethods.length) {
      changes.added.push({ path, methods: newMethods });
    } else if (oldMethods.length && !newMethods.length) {
      changes.removed.push({ path, methods: oldMethods });
    } else {
      const addedMethods = newMethods.filter(m => !oldMethods.includes(m));
      const removedMethods = oldMethods.filter(m => !newMethods.includes(m));

      if (addedMethods.length || removedMethods.length) {
        changes.modified.push({
          path,
          added: addedMethods,
          removed: removedMethods,
          existing: newMethods.filter(m => oldMethods.includes(m))
        });
      } else {
        changes.unchanged.push({ path, methods: newMethods });
      }
    }
  }

  return changes;
}

function generateSummaryGrid(changes: Changes): string {
  const totalAdded = changes.added.length + changes.modified.reduce((sum, m) => sum + m.added.length, 0);
  const totalRemoved = changes.removed.length + changes.modified.reduce((sum, m) => sum + m.removed.length, 0);
  const totalModified = changes.modified.length;
  const isBreaking = totalRemoved > 0 || changes.removed.length > 0;

  return `
| Change Type | Count | Details |
|-------------|-------|---------|
| 🟢 Added Endpoints | ${changes.added.length} | New API endpoints |
| 🔴 Removed Endpoints | ${changes.removed.length} | ${isBreaking ? '⚠️ **Breaking**' : ''} |
| 🟡 Modified Endpoints | ${totalModified} | Endpoints with method changes |
| 📊 Total Method Changes | +${totalAdded} / -${totalRemoved} | Added/Removed HTTP methods |
| ⚠️ Breaking Changes | ${isBreaking ? 'Yes' : 'No'} | ${isBreaking ? 'This PR contains breaking changes' : 'No breaking changes detected'} |
`;
}

function generateDetailedDiff(oldSchema: OpenAPISchema, newSchema: OpenAPISchema, changes: Changes): string {
  let diff = '';

  if (changes.added.length > 0) {
    diff += `
<details>
<summary>🟢 Added Endpoints (${changes.added.length})</summary>

| Path | Methods | Description |
|------|---------|-------------|
`;
    changes.added.forEach(({ path, methods }) => {
      const description = newSchema.paths?.[path]?.get?.summary ||
        newSchema.paths?.[path]?.[methods[0]]?.summary ||
        'No description';
      diff += `| \`${path}\` | ${methods.map(m => `\`${m.toUpperCase()}\``).join(', ')} | ${description} |\n`;
    });
    diff += '\n</details>\n';
  }

  if (changes.removed.length > 0) {
    diff += `
<details>
<summary>🔴 Removed Endpoints (${changes.removed.length}) ⚠️ Breaking</summary>

| Path | Methods | Description |
|------|---------|-------------|
`;
    changes.removed.forEach(({ path, methods }) => {
      const description = oldSchema.paths?.[path]?.get?.summary ||
        oldSchema.paths?.[path]?.[methods[0]]?.summary ||
        'No description';
      diff += `| \`${path}\` | ${methods.map(m => `\`${m.toUpperCase()}\``).join(', ')} | ${description} |\n`;
    });
    diff += '\n</details>\n';
  }

  if (changes.modified.length > 0) {
    diff += `
<details>
<summary>🟡 Modified Endpoints (${changes.modified.length})</summary>

`;
    changes.modified.forEach(({ path, added, removed, existing }) => {
      diff += `
**\`${path}\`**
`;
      if (added.length > 0) {
        diff += `- ✅ Added: ${added.map(m => `\`${m.toUpperCase()}\``).join(', ')}\n`;
      }
      if (removed.length > 0) {
        diff += `- ❌ Removed: ${removed.map(m => `\`${m.toUpperCase()}\``).join(', ')} ⚠️\n`;
      }
      if (existing.length > 0) {
        diff += `- ➡️ Unchanged: ${existing.map(m => `\`${m.toUpperCase()}\``).join(', ')}\n`;
      }
      diff += '\n';
    });
    diff += '</details>\n';
  }

  // Schema components diff
  const oldComponents = Object.keys(oldSchema.components?.schemas || {});
  const newComponents = Object.keys(newSchema.components?.schemas || {});
  const addedComponents = newComponents.filter(c => !oldComponents.includes(c));
  const removedComponents = oldComponents.filter(c => !newComponents.includes(c));

  if (addedComponents.length > 0 || removedComponents.length > 0) {
    diff += `
<details>
<summary>📋 Schema Components Changes</summary>

`;
    if (addedComponents.length > 0) {
      diff += `**Added Schemas (${addedComponents.length}):**\n`;
      addedComponents.forEach(comp => {
        diff += `- \`${comp}\`\n`;
      });
      diff += '\n';
    }

    if (removedComponents.length > 0) {
      diff += `**Removed Schemas (${removedComponents.length}):** ⚠️\n`;
      removedComponents.forEach(comp => {
        diff += `- \`${comp}\`\n`;
      });
      diff += '\n';
    }
    diff += '</details>\n';
  }

  return diff;
}

function main(): void {
  const [, , oldSchemaPath, newSchemaPath, outputPath] = process.argv;

  if (!oldSchemaPath || !newSchemaPath) {
    console.error('Usage: tsx compare-openapi.ts <old-schema.json> <new-schema.json> [output.md]');
    process.exit(1);
  }

  const oldSchema = loadSchema(oldSchemaPath);
  const newSchema = loadSchema(newSchemaPath);

  const oldPaths = extractPaths(oldSchema);
  const newPaths = extractPaths(newSchema);

  const changes = categorizeChanges(oldPaths, newPaths);

  // Check if there are any changes
  const hasChanges = changes.added.length > 0 || changes.removed.length > 0 || changes.modified.length > 0;

  let output = '';

  if (!hasChanges) {
    output = `<!-- ucdjs:openapi-artifacts -->
## 📋 OpenAPI Schema Analysis

✅ **No changes detected** - The OpenAPI schema is identical to the main branch.

---
<sub>🤖 This comment is automatically updated when you push new commits.</sub>
`;
  } else {
    const summaryGrid = generateSummaryGrid(changes);
    const detailedDiff = generateDetailedDiff(oldSchema, newSchema, changes);

    output = `<!-- ucdjs:openapi-artifacts -->
## 📋 OpenAPI Schema Analysis

### Summary
${summaryGrid}

### Detailed Changes
${detailedDiff}

---
<sub>🤖 This comment is automatically updated when you push new commits.</sub>
`;
  }

  if (outputPath) {
    writeFileSync(outputPath, output);
    console.log(`OpenAPI diff written to ${outputPath}`);
  } else {
    console.log(output);
  }

  // Exit with code 1 if there are changes (for CI detection)
  process.exit(hasChanges ? 1 : 0);
}

main();

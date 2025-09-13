import { readFileSync, writeFileSync } from "node:fs";

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

const MAIN_SCHEMA_PATH = process.env.MAIN_SCHEMA_PATH;
const PR_SCHEMA_PATH = process.env.PR_SCHEMA_PATH;
const OUTPUT_PATH = process.env.OUTPUT_PATH;

const HTTP_METHODS = [
  "get",
  "post",
  "put",
  "patch",
  "delete",
  "head",
  "options",
];

const BASE_TEMPLATE_HEADER = `<!-- ucdjs:openapi-artifacts -->
## 📋 OpenAPI Schema Analysis
`;

const BASE_TEMPLATE_FOOTER = `
---
<sub>🤖 This comment is automatically updated when you push new commits.</sub>
`;

function loadSchema(filePath: string): OpenAPISchema {
  try {
    const content = readFileSync(filePath, "utf8");
    const schema = JSON.parse(content);
    if (
      typeof schema !== "object" ||
      schema === null ||
      (!schema.paths && !schema.components)
    ) {
      throw new Error(
        'File does not appear to be a valid OpenAPI schema (missing "paths" or "components").',
      );
    }
    return schema;
  } catch (err) {
    console.error(`error loading schema from ${filePath}:`, err);
    process.exit(1);
  }
}

function extractPaths(schema: OpenAPISchema): Record<string, string[]> {
  const paths: Record<string, string[]> = {};

  if (!("paths" in schema) || typeof schema.paths !== "object") {
    return paths;
  }

  for (const [path, methods] of Object.entries(schema.paths)) {
    paths[path] = Object.keys(methods).filter((method) =>
      HTTP_METHODS.includes(method.toLowerCase()),
    );
  }

  return paths;
}

function categorizeChanges(
  oldPaths: Record<string, string[]>,
  newPaths: Record<string, string[]>,
): Changes {
  const changes: Changes = {
    added: [],
    removed: [],
    modified: [],
    unchanged: [],
  };

  const allPaths = new Set([
    ...Object.keys(oldPaths),
    ...Object.keys(newPaths),
  ]);

  for (const path of allPaths) {
    const oldMethods = oldPaths[path] || [];
    const newMethods = newPaths[path] || [];

    if (!oldMethods.length && newMethods.length) {
      changes.added.push({ path, methods: newMethods });
    } else if (oldMethods.length && !newMethods.length) {
      changes.removed.push({ path, methods: oldMethods });
    } else {
      const addedMethods = newMethods.filter((m) => !oldMethods.includes(m));
      const removedMethods = oldMethods.filter((m) => !newMethods.includes(m));

      if (!addedMethods.length && !removedMethods.length) {
        changes.unchanged.push({ path, methods: newMethods });
        continue;
      }

      changes.modified.push({
        path,
        added: addedMethods,
        removed: removedMethods,
        existing: newMethods.filter((m) => oldMethods.includes(m)),
      });
    }
  }

  return changes;
}

function generateSummaryGrid(changes: Changes): string {
  const totalAdded =
    changes.added.length +
    changes.modified.reduce((sum, m) => sum + m.added.length, 0);
  const totalRemoved =
    changes.removed.length +
    changes.modified.reduce((sum, m) => sum + m.removed.length, 0);
  const totalModified = changes.modified.length;
  const isBreaking = totalRemoved > 0 || changes.removed.length > 0;

  let content = "";

  content += "| Change Type | Count | Details |\n";
  content += "|-------------|-------|---------|\n";
  content += `| 🟢 Added Endpoints | ${changes.added.length} | New API endpoints |\n`;
  content += `| 🔴 Removed Endpoints | ${changes.removed.length} | ${isBreaking ? "⚠️ **Breaking**" : ""} |\n`;
  content += `| 🟡 Modified Endpoints | ${totalModified} | Endpoints with method changes |\n`;
  content += `| 📊 Total Method Changes | +${totalAdded} / -${totalRemoved} | Added/Removed HTTP methods |\n`;
  content += `| ⚠️ Breaking Changes | ${isBreaking ? "Yes" : "No"} | ${isBreaking ? "This PR contains breaking changes" : "No breaking changes detected"} |\n`;

  return content;
}

function generateDetailedDiff(
  oldSchema: OpenAPISchema,
  newSchema: OpenAPISchema,
  changes: Changes,
): string {
  let diff = "";

  if (changes.added.length > 0) {
    diff += "\n";
    diff += "<details>\n";
    diff += `<summary>🟢 Added Endpoints (${changes.added.length})</summary>\n`;
    diff += "\n";
    diff += "| Path | Methods | Description |\n";
    diff += "|------|---------|-------------|\n";

    changes.added.forEach(({ path, methods }) => {
      const description =
        newSchema.paths?.[path]?.get?.summary ||
        newSchema.paths?.[path]?.[methods[0]]?.summary ||
        "No description";
      diff += `| \`${path}\` | ${methods.map((m) => `\`${m.toUpperCase()}\``).join(", ")} | ${description} |\n`;
    });

    diff += "\n";
    diff += "</details>\n";
  }

  if (changes.removed.length > 0) {
    diff += "\n";
    diff += "<details>\n";
    diff += `<summary>🔴 Removed Endpoints (${changes.removed.length}) ⚠️ Breaking</summary>\n`;
    diff += "\n";
    diff += "| Path | Methods | Description |\n";
    diff += "|------|---------|-------------|\n";

    changes.removed.forEach(({ path, methods }) => {
      const description =
        oldSchema.paths?.[path]?.get?.summary ||
        oldSchema.paths?.[path]?.[methods[0]]?.summary ||
        "No description";
      diff += `| \`${path}\` | ${methods.map((m) => `\`${m.toUpperCase()}\``).join(", ")} | ${description} |\n`;
    });

    diff += "\n";
    diff += "</details>\n";
  }

  if (changes.modified.length > 0) {
    diff += "\n";
    diff += "<details>\n";
    diff += `<summary>🟡 Modified Endpoints (${changes.modified.length})</summary>\n`;
    diff += "\n";

    changes.modified.forEach(({ path, added, removed, existing }) => {
      diff += "\n";
      diff += `**\`${path}\`**\n`;

      if (added.length > 0) {
        diff += `- ✅ Added: ${added.map((m) => `\`${m.toUpperCase()}\``).join(", ")}\n`;
      }
      if (removed.length > 0) {
        diff += `- ❌ Removed: ${removed.map((m) => `\`${m.toUpperCase()}\``).join(", ")} ⚠️\n`;
      }
      if (existing.length > 0) {
        diff += `- ➡️ Unchanged: ${existing.map((m) => `\`${m.toUpperCase()}\``).join(", ")}\n`;
      }
      diff += "\n";
    });

    diff += "</details>\n";
  }

  // Schema components diff
  const oldComponents = Object.keys(oldSchema.components?.schemas || {});
  const newComponents = Object.keys(newSchema.components?.schemas || {});
  const addedComponents = newComponents.filter(
    (c) => !oldComponents.includes(c),
  );
  const removedComponents = oldComponents.filter(
    (c) => !newComponents.includes(c),
  );

  if (addedComponents.length > 0 || removedComponents.length > 0) {
    diff += "\n";
    diff += "<details>\n";
    diff += "<summary>📋 Schema Components Changes</summary>\n";
    diff += "\n";

    if (addedComponents.length > 0) {
      diff += `**Added Schemas (${addedComponents.length}):**\n`;
      addedComponents.forEach((comp) => {
        diff += `- \`${comp}\`\n`;
      });
      diff += "\n";
    }

    if (removedComponents.length > 0) {
      diff += `**Removed Schemas (${removedComponents.length}):** ⚠️\n`;
      removedComponents.forEach((comp) => {
        diff += `- \`${comp}\`\n`;
      });
      diff += "\n";
    }

    diff += "</details>\n";
  }

  return diff;
}

async function run(): Promise<void> {
  if (!MAIN_SCHEMA_PATH || !PR_SCHEMA_PATH || !OUTPUT_PATH) {
    console.error(
      "MAIN_SCHEMA_PATH, PR_SCHEMA_PATH, and OUTPUT_PATH environment variables must be set.",
    );
    process.exit(1);
  }

  const oldSchema = loadSchema(MAIN_SCHEMA_PATH);
  const newSchema = loadSchema(PR_SCHEMA_PATH);

  const oldPaths = extractPaths(oldSchema);
  const newPaths = extractPaths(newSchema);

  const changes = categorizeChanges(oldPaths, newPaths);

  const hasChanges =
    changes.added.length > 0 ||
    changes.removed.length > 0 ||
    changes.modified.length > 0;

  // calculate breaking changes
  const hasBreakingChanges = changes.removed.length > 0 ||
    changes.modified.some(m => m.removed.length > 0);

  // set outputs
  const githubOutput = process.env.GITHUB_OUTPUT;
  if (githubOutput) {
    const outputs = [
      `has_changes=${hasChanges}`,
      `has_breaking_changes=${hasBreakingChanges}`,
      `added_endpoints=${changes.added.length}`,
      `removed_endpoints=${changes.removed.length}`,
      `modified_endpoints=${changes.modified.length}`
    ];

    writeFileSync(githubOutput, outputs.join('\n') + '\n', { flag: 'a' });
  }

  let output = BASE_TEMPLATE_HEADER;

  if (!hasChanges) {
    output +=
      "✅ **No changes detected** - The OpenAPI schema is identical to the main branch.";
  } else {
    const summaryGrid = generateSummaryGrid(changes);
    const detailedDiff = generateDetailedDiff(oldSchema, newSchema, changes);

    output += "### Summary\n";
    output += summaryGrid;
    output += "\n\n";
    output += "### Detailed Changes\n";
    output += detailedDiff;
  }

  output += BASE_TEMPLATE_FOOTER;

  writeFileSync(OUTPUT_PATH, output);
  console.log(`OpenAPI diff written to ${OUTPUT_PATH}`);

  if (hasChanges) {
    console.log("OpenAPI schemas differ.");
    process.exit(1);
  } else {
    console.log("No differences in OpenAPI schemas.");
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

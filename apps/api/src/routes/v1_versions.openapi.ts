import { createRoute } from "@hono/zod-openapi";
import { dedent } from "@luxass/utils";
import { cache } from "hono/cache";
import { generateReferences, OPENAPI_TAGS } from "../openapi";
import { UnicodeFileTreeSchema, UnicodeVersionListSchema } from "./v1_versions.schemas";

export const LIST_ALL_UNICODE_VERSIONS_ROUTE = createRoute({
  method: "get",
  path: "/",
  tags: [OPENAPI_TAGS.VERSIONS],
  middleware: [
    cache({
      cacheName: "ucdjs:v1_versions:list",
      cacheControl: "max-age=345600", // 4 days
    }),
  ],
  description: "List all Unicode Versions available, including metadata and support status.",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: UnicodeVersionListSchema,
        },
      },
      description: "A list of Unicode versions with metadata and support status.",
    },
    ...(generateReferences([
      404,
      429,
      500,
    ])),
  },
});

export const GET_VERSION_FILE_TREE_ROUTE = createRoute({
  method: "get",
  path: "/{version}/file-tree",
  tags: [OPENAPI_TAGS.VERSIONS, OPENAPI_TAGS.FILES],
  middleware: [
    cache({
      cacheName: "ucdjs:v1_versions:file-tree",
      cacheControl: "max-age=604800", // 1 week
    }),
  ],
  parameters: [
    {
      name: "version",
      in: "path",
      required: true,
      description: dedent`
          Unicode version to retrieve file listings for. Supports both standard and legacy version formats.

          ## Supported Formats

          | Format | Example | Description |
          |--------|---------|-------------|
          | **Standard** | \`15.1.0\` | Current Unicode versioning |
          | **Legacy** | \`3.1.1\` | Maps to \`3.1-Update1\` |
          | **Latest** | \`latest\` | Always points to newest stable version |

          ## Version Examples

          - \`15.1.0\` - Unicode 15.1.0 (latest stable)
          - \`15.0.0\` - Unicode 15.0.0
          - \`14.0.0\` - Unicode 14.0.0
          - \`3.1.1\` - Unicode 3.1 Update 1 (legacy format)
          - \`latest\` - Automatically resolves to current stable version
        `,
      schema: {
        type: "string",
        pattern: "^(latest|\\d+\\.\\d+\\.\\d+)$",
      },
      examples: {
        latest: {
          summary: "Latest stable version",
          value: "latest",
        },
        current: {
          summary: "Unicode 15.1.0",
          value: "15.1.0",
        },
        legacy: {
          summary: "Legacy version format",
          value: "3.1.1",
        },
      },
    },
  ],
  description: dedent`
      # Unicode File Directory Listing

      Get a **structured, hierarchical listing** of all Unicode Character Database (UCD) files for a specific version.

      This endpoint provides an organized view of the Unicode data file structure, perfect for building file explorers, documentation systems, or automated tools that need to discover available Unicode data files.

      ## What You Get

      - 📁 **Hierarchical structure** - Files organized by directories and subdirectories
      - 📊 **File metadata** - Size, type, and path information for each file
      - 🗂️ **Directory traversal** - Nested structure shows complete file organization
      - ⚡ **Optimized format** - Structured JSON designed for programmatic use

      ## Use Cases

      | Use Case | Description | Example |
      |----------|-------------|---------|
      | **File Discovery** | Find available UCD files for a version | Discover all emoji data files |
      | **Documentation** | Generate file listings for docs | Create downloadable file indexes |
      | **Automation** | Build tools that process multiple files | Batch download all property files |
      | **File Browsers** | Create interactive UCD explorers | Show users browsable file tree |

      ## Difference from Raw Access

      Unlike the proxy endpoints that provide raw file content, this endpoint:
      - Returns **structured metadata** instead of file contents
      - Provides **hierarchical organization** of the complete file system
      - Is optimized for **discovery and navigation** rather than content retrieval
      - Uses **structured parsing** of Unicode.org directory listings

      ## Caching & Performance

      - ⏱️ **1-week cache** - File structures change infrequently
      - 🚀 **Fast response** - No large file downloads, metadata only
      - 📦 **Compressed data** - Efficient JSON structure
    `,
  responses: {
    200: {
      content: {
        "application/json": {
          schema: UnicodeFileTreeSchema,
        },
      },
      description: dedent`
          ## ✅ File Directory Structure

          Returns a hierarchical JSON structure representing the complete Unicode data file organization.

          ### Response Structure

          Each item in the array represents either a **file** or **directory**:

          #### File Objects
          \`\`\`json
          {
            "name": "UnicodeData.txt",
            "type": "file",
            "path": "/Public/15.1.0/ucd/UnicodeData.txt",
            "size": 1889024
          }
          \`\`\`

          #### Directory Objects
          \`\`\`json
          {
            "name": "emoji",
            "type": "directory",
            "path": "/Public/15.1.0/ucd/emoji/",
            "children": [...]
          }
          \`\`\`

          ### Key Features

          - 🏗️ **Nested structure** - Directories contain \`children\` arrays
          - 📏 **File sizes** - All file objects include size in bytes
          - 🛤️ **Full paths** - Complete paths for direct file access
          - 📂 **Directory detection** - Clear distinction between files and folders

          ### Processing Tips

          - Use \`type\` field to distinguish files from directories
          - Traverse \`children\` arrays recursively for deep exploration
          - Use \`path\` values with raw access endpoints to retrieve content
        `,
    },
    ...(generateReferences([
      400,
      429,
      500,
      502,
    ])),
  },
});

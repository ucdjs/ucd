import type { UnicodeTreeNode } from "@ucdjs/schemas";

/**
 * Standard mock endpoint configuration for tests
 */
export const MOCK_CONFIG = {
  version: "1.0",
  endpoints: {
    files: "/api/v1/files",
    manifest: "/api/v1/files/.ucd-store.json",
    versions: "/api/v1/versions",
  },
} as const;

/**
 * Standard mock file tree structure for tests
 */
export const MOCK_TREE: UnicodeTreeNode[] = [
  {
    name: "UnicodeData.txt",
    type: "file",
    path: "UnicodeData.txt",
  },
  {
    name: "extracted",
    type: "directory",
    path: "extracted",
    children: [
      {
        name: "DerivedAge.txt",
        type: "file",
        path: "extracted/DerivedAge.txt",
      },
      {
        name: "DerivedName.txt",
        type: "file",
        path: "extracted/DerivedName.txt",
      },
    ],
  },
  {
    name: "ReadMe.txt",
    type: "file",
    path: "ReadMe.txt",
  },
];

/**
 * Helper to create mock version objects for API responses
 */
export function createMockVersions(versions: string[]) {
  return versions.map((version) => ({
    version,
    documentationUrl: `https://www.unicode.org/versions/Unicode${version}/`,
    date: "2024",
    url: `https://www.unicode.org/Public/${version}`,
    mappedUcdVersion: null,
    type: "stable" as const,
  }));
}

/**
 * Helper to create custom file tree structures
 */
export function createMockFileTree(files: Array<{ path: string; type?: "file" | "directory"; children?: UnicodeTreeNode[] }>): UnicodeTreeNode[] {
  return files.map((file) => {
    const pathParts = file.path.split("/");
    const name = pathParts[pathParts.length - 1] || file.path;

    if (file.type === "directory") {
      return {
        name,
        type: "directory",
        path: file.path,
        children: file.children || [],
      } satisfies UnicodeTreeNode;
    }

    return {
      name,
      type: "file",
      path: file.path,
    } satisfies UnicodeTreeNode;
  });
}

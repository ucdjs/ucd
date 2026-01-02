import type { MockStoreNode } from "./types";

/**
 * Recursively traverses the file tree and adds paths to all nodes.
 * The path format is: /{version}/{pathname}
 *
 * @param nodes - The file nodes without paths
 * @param version - The version to include in the path
 * @param basePath - The base path to prepend (defaults to empty)
 * @returns File nodes with paths added
 */
export function addPathsToFileNodes(
  nodes: MockStoreNode[],
  version: string,
  basePath: string = "",
): MockStoreNode[] {
  return nodes.map((node) => {
    const pathSegments = [basePath, node.name].filter(Boolean).join("/");
    const fullPath = `/${version}/${pathSegments}`;

    if (node.type === "directory") {
      const dirNode = node as Extract<MockStoreNode, { type: "directory" }>;
      return {
        ...dirNode,
        path: fullPath,
        children: addPathsToFileNodes(
          dirNode.children,
          version,
          pathSegments,
        ),
      };
    }

    const fileNode = node as Extract<MockStoreNode, { type: "file" }>;
    return {
      ...fileNode,
      path: fullPath,
    };
  });
}

/**
 * Adds paths to all file nodes in the mock store files configuration.
 * For version-specific files, paths will be formatted as: /{version}/{pathname}
 * For wildcard files ("*"), paths will be formatted as: /{version}/{pathname}
 * where version is taken from the versions array.
 *
 * @param files - The mock store files configuration without paths
 * @param versions - Array of versions to use for path generation
 * @returns Files with paths added
 */
export function addPathsToMockStoreFiles(
  files: Record<string, MockStoreNode[] | undefined> | undefined,
  versions: string[],
): Record<string, MockStoreNode[]> {
  const result: Record<string, MockStoreNode[]> = {};

  if (!files) {
    return result;
  }

  for (const [key, nodes] of Object.entries(files)) {
    if (!nodes) continue;

    if (key === "*") {
      // For wildcard, use the first version to generate paths
      const version = versions[0] || "16.0.0";
      result[key] = addPathsToFileNodes(nodes, version);
    } else {
      // For version-specific keys, use the version as the key
      result[key] = addPathsToFileNodes(nodes, key);
    }
  }

  return result;
}

import type { MockStoreNode, MockStoreNodeWithPath } from "./types";

/**
 * Recursively traverses the file tree and adds paths to all nodes.
 * The path format is: /{prefix}/basePath/pathname or /basePath/pathname if prefix is empty
 *
 * @param {MockStoreNode[]} nodes - The file nodes without paths
 * @param {string} prefix - The prefix to include in the path (e.g., version). If empty, path starts with basePath
 * @param {string} [basePath] - The base path to prepend (defaults to "ucd")
 * @returns File nodes with paths added
 */
export function addPathsToFileNodes(
  nodes: MockStoreNode[],
  prefix: string,
  basePath: string = "ucd",
): MockStoreNodeWithPath[] {
  return nodes.map((node) => {
    const pathSegments = [basePath, node.name].filter(Boolean).join("/");
    const fullPath = prefix ? `/${prefix}/${pathSegments}` : `/${pathSegments}`;

    if (node.type === "directory") {
      const dirNode = node as Extract<MockStoreNode, { type: "directory" }>;
      return {
        ...dirNode,
        path: `${fullPath}/`,
        children: addPathsToFileNodes(
          dirNode.children,
          prefix,
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

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
        path: `${fullPath}/`,
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

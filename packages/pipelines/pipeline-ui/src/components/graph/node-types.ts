import {
  ArtifactNode,
  FileNode,
  OutputNode,
  RouteNode,
  SourceNode,
} from "./nodes";

// Hoisted outside component to maintain stable reference
export const nodeTypes = {
  source: SourceNode,
  file: FileNode,
  route: RouteNode,
  artifact: ArtifactNode,
  output: OutputNode,
} as const;

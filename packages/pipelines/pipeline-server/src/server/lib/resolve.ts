import path from "node:path";

export function resolveLocalFilePath(cwd: string, filePath: string): string {
  const resolved = path.resolve(cwd, filePath);
  const relative = path.relative(cwd, resolved);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Invalid pipeline file path");
  }

  return resolved;
}

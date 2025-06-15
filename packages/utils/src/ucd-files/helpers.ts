import type { UnicodeVersionFile } from "@luxass/unicode-utils-new/fetch";

export function flattenFilePaths(entries: UnicodeVersionFile[], prefix = ""): string[] {
  const paths: string[] = [];

  for (const file of entries) {
    const fullPath = prefix ? `${prefix}/${file.name}` : file.name;

    if (file.children) {
      paths.push(...flattenFilePaths(file.children, fullPath));
    } else {
      paths.push(fullPath);
    }
  }

  return paths;
}

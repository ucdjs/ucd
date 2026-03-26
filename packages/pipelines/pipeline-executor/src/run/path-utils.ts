export function basename(p: string): string {
  // eslint-disable-next-line e18e/prefer-static-regex
  const trimmed = p.replace(/\/+$/, "");
  if (trimmed === "") return "";
  return trimmed.slice(trimmed.lastIndexOf("/") + 1);
}

export function extname(p: string): string {
  const base = basename(p);
  const dot = base.lastIndexOf(".");
  return dot > 0 ? base.slice(dot) : "";
}

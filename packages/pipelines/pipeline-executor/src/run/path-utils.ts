export function basename(p: string): string {
  return p.slice(p.lastIndexOf("/") + 1);
}

export function extname(p: string): string {
  const base = basename(p);
  const dot = base.lastIndexOf(".");
  return dot > 0 ? base.slice(dot) : "";
}

export const nodeTypeColors: Record<string, string> = {
  source: "#6366f1",
  file: "#10b981",
  route: "#f59e0b",
  artifact: "#8b5cf6",
  output: "#0ea5e9",
  default: "#6b7280",
};

export function getNodeColor(node: { type?: string }): string {
  const color = nodeTypeColors[node.type ?? ""];
  return color ?? nodeTypeColors.default ?? "#6b7280";
}

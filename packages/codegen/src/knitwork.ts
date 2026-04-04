export function buildInterface(name: string, fields: Record<string, string>, opts?: { export?: boolean }): string {
  const prefix = opts?.export ? "export " : "";
  const body = Object.entries(fields)
    .map(([key, type]) => `  ${key}: ${type};`)
    .join("\n");
  return `${prefix}interface ${name} {\n${body}\n}`;
}

export function buildStringArray(values: string[]): string {
  if (values.length === 0) {
    return "[]";
  }
  return `[${values.map((v) => `"${v}"`).join(", ")}]`;
}

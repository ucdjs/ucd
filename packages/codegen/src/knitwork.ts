export function buildInterface(
  name: string,
  fields: Record<string, string>,
  opts?: { export?: boolean; descriptions?: Record<string, string> },
): string {
  const prefix = opts?.export ? "export " : "";
  const body = Object.entries(fields)
    .map(([key, type]) => {
      const description = opts?.descriptions?.[key];
      const jsdoc = description ? `  /**\n   * ${description}\n   */\n` : "";
      return `${jsdoc}  ${key}: ${type};`;
    })
    .join("\n");
  return `${prefix}interface ${name} {\n${body}\n}`;
}

export function buildStringArray(values: string[]): string {
  if (values.length === 0) {
    return "[]";
  }
  return `[${values.map((v) => `"${v}"`).join(", ")}]`;
}

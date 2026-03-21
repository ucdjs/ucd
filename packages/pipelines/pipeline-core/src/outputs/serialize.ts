export function serializeOutputValue(value: unknown, format: "json" | "text"): string {
  if (format === "text") {
    return typeof value === "string" ? value : JSON.stringify(value, null, 2);
  }

  return JSON.stringify(value, null, 2);
}

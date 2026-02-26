import { transform } from "oxc-transform";

export async function compileModuleSource(filePath: string, source: string): Promise<string> {
  const result = await transform(filePath, source, { sourceType: "module" });

  if (result.errors && result.errors.length > 0) {
    const message = result.errors.map((error) => error.message).join("\n");
    throw new Error(`Failed to parse module ${filePath}: ${message}`);
  }

  return result.code;
}

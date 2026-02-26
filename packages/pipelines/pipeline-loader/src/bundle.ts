import { build } from "rolldown";

export async function bundleModule(entryPath: string): Promise<string> {
  const result = await build({
    input: entryPath,
    write: false,
    output: {
      format: "esm",
    },
    // Rolldown handles TypeScript natively!
    // It also resolves extensionless imports like ./helper -> ./helper.ts
  });

  const outputs = Array.isArray(result) ? result : [result];
  const chunks = outputs.flatMap((output) => output.output ?? []);
  const chunk = chunks.find((item: { type: string }) => item.type === "chunk");

  if (!chunk || chunk.type !== "chunk") {
    throw new Error("Failed to bundle module");
  }

  return chunk.code;
}

export function createDataUrl(code: string): string {
  // eslint-disable-next-line node/prefer-global/buffer
  const encoded = Buffer.from(code, "utf-8").toString("base64");
  return `data:text/javascript;base64,${encoded}`;
}

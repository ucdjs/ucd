import { build } from "rolldown";

export interface BundleResult {
  code: string;
  dataUrl: string;
}

export async function bundle(options: {
  entryPath: string;
  cwd: string;
}): Promise<BundleResult> {
  const result = await build({
    input: options.entryPath,
    write: false,
    output: {
      format: "esm",
    },
    cwd: options.cwd,
  });

  const outputs = Array.isArray(result) ? result : [result];
  const chunks = outputs.flatMap((output) => output.output ?? []);
  const chunk = chunks.find((item: { type: string }) => item.type === "chunk");

  if (!chunk || chunk.type !== "chunk") {
    throw new Error("Failed to bundle module");
  }

  return {
    code: chunk.code,
    // eslint-disable-next-line node/prefer-global/buffer
    dataUrl: `data:text/javascript;base64,${Buffer.from(chunk.code, "utf-8").toString("base64")}`,
  };
}

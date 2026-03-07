import type { RolldownOutput } from "rolldown";
import { build } from "rolldown";
import { BundleError, BundleResolveError, BundleTransformError } from "./errors";

export interface BundleResult {
  code: string;
  dataUrl: string;
}

export async function bundle(options: {
  entryPath: string;
  cwd: string;
}): Promise<BundleResult> {
  let result: RolldownOutput | undefined;

  try {
    result = await build({
      input: options.entryPath,
      write: false,
      output: {
        format: "esm",
      },
      cwd: options.cwd,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);

    if (/could not resolve|cannot find module/i.test(msg)) {
      const importMatch = msg.match(/"([^"]+)"/);
      throw new BundleResolveError(options.entryPath, importMatch?.[1] ?? "", { cause: err });
    }

    if (/unexpected token|syntaxerror|parse error|expected|transform/i.test(msg)) {
      throw new BundleTransformError(options.entryPath, { cause: err });
    }

    throw new BundleTransformError(options.entryPath, { cause: err });
  }

  const outputs = Array.isArray(result) ? result : [result];
  const chunks = outputs.flatMap((output) => output.output ?? []);
  const chunk = chunks.find((item: { type: string }) => item.type === "chunk");

  if (!chunk || chunk.type !== "chunk") {
    throw new BundleError(options.entryPath, "Failed to bundle module");
  }

  return {
    code: chunk.code,
    // eslint-disable-next-line node/prefer-global/buffer
    dataUrl: `data:text/javascript;base64,${Buffer.from(chunk.code, "utf-8").toString("base64")}`,
  };
}

import type { InputOptions, RolldownOutput } from "rolldown";
import { build } from "rolldown";
import { BundleError, BundleResolveError, BundleTransformError } from "./errors";

const RESOLVE_ERROR_RE = /could not resolve|cannot find module/i;
const QUOTED_IMPORT_RE = /"([^"]+)"/;
const TRANSFORM_ERROR_RE = /unexpected token|syntaxerror|parse error|expected|transform/i;

export interface BundleResult {
  code: string;
  dataUrl: string;
}

export interface BundleOptions {
  entryPath: string;
  cwd: string;
  buildOptions?: Omit<InputOptions, "input" | "cwd" | "tsconfig" | "onLog">;
}

export async function bundle(options: BundleOptions): Promise<BundleResult> {
  let result: RolldownOutput | undefined;

  try {
    result = await build({
      ...options.buildOptions,
      input: options.entryPath,
      write: false,
      output: {
        format: "esm",
      },
      cwd: options.cwd,
      tsconfig: true,
      onLog(level, log, defaultHandler) {
        if (level === "warn") {
          // If we receive a warning, treat it as an error since it likely indicates a problem with the code that could lead to runtime issues.
          throw new Error(log.message);
        }

        defaultHandler(level, log);
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);

    if (RESOLVE_ERROR_RE.test(msg)) {
      const importMatch = msg.match(QUOTED_IMPORT_RE);
      throw new BundleResolveError(options.entryPath, importMatch?.[1] ?? "", { cause: err });
    }

    if (TRANSFORM_ERROR_RE.test(msg)) {
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

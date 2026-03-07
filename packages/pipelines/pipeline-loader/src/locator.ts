import type { PipelineLocator, RemotePipelineLocator } from "./materialize";

export function parsePipelineLocator(input: string): PipelineLocator {
  if (input.startsWith("github://") || input.startsWith("gitlab://")) {
    const provider = input.startsWith("github://") ? "github" : "gitlab";
    const parsed = new URL(input.replace(`${provider}://`, "https://fake-host/"));
    const [, owner, repo] = parsed.pathname.split("/");
    if (!owner || !repo) {
      throw new Error(`Invalid ${provider} locator: ${input}`);
    }

    return {
      kind: "remote",
      provider,
      owner,
      repo,
      ref: parsed.searchParams.get("ref") ?? "HEAD",
      path: parsed.searchParams.get("path") ?? undefined,
    };
  }

  return {
    kind: "local",
    path: input,
  };
}

export function parseRemoteSourceUrl(url: string): RemotePipelineLocator | null {
  try {
    const locator = parsePipelineLocator(url);
    return locator.kind === "remote" ? locator : null;
  } catch {
    return null;
  }
}

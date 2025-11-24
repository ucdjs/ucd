import { createReleaseScripts } from "@ucdjs/release-scripts";

const workspaceRoot = new URL("../", import.meta.url);

export const { release, publish, verify } = await createReleaseScripts({
  repo: "ucdjs/ucd",
  workspaceRoot: workspaceRoot.pathname,
  packages: {
    excludePrivate: true,
    exclude: [
      "vscode-ucd"
    ]
  },
  safeguards: process.env.DISABLE_SAFEGUARDS == null,
  prompts: {
    packages: process.env.CI == null,
    versions: process.env.CI == null,
  },
  githubToken: process.env.UCDJS_RELEASE_TOKEN!,
})

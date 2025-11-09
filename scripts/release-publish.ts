import { publish } from "@ucdjs/release-scripts"

const workspaceRoot = new URL("../", import.meta.url);

publish({
  repo: "ucdjs/ucd",
  workspaceRoot: workspaceRoot.pathname,
  packages: {
    excludePrivate: true,
    exclude: [
      "vscode-ucd"
    ]
  },
  prompts: {
    packages: process.env.CI == null,
    versions: process.env.CI == null,
  },
  githubToken: process.env.UCDJS_RELEASE_TOKEN!,
})

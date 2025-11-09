import { release } from '@ucdjs/release-scripts'

const workspaceRoot = new URL('../', import.meta.url);

release({
  repo: 'ucdjs/ucd',
  workspaceRoot: workspaceRoot.pathname,
  packages: {
    excludePrivate: true,
    excluded: [
      "vscode-ucd"
    ]
  },
  safeguards: true,
  prompts: {
    packages: process.env.CI == null,
    versions: process.env.CI == null,
  },
  githubToken: process.env.UCDJS_RELEASE_TOKEN!,
})

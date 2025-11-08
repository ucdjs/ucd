import { release } from '@ucdjs/release-scripts'

release({
  repo: 'ucdjs/ucd',
  packages: {
    excludePrivate: true,
    excluded: [
      "vscode-ucd"
    ]
  },
  prompts: {
    packages: process.env.CI == null,
    versions: process.env.CI == null,
  },
  githubToken: process.env.UCDJS_RELEASE_TOKEN!,
})

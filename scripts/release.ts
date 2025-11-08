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
    packages: process.env.CI == null
  },
  githubToken: process.env.MY_CUSTOM_GITHUB_TOKEN!,
})

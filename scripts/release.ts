import { release } from '@ucdjs/release-scripts'

release({
  repo: 'ucdjs/ucd',
  packages: {
    excludePrivate: true,
  },
  toTag: (pkg, version) => {
    return pkg + "@" + version
  },
})

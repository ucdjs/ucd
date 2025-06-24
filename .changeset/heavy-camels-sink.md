---
"@ucdjs/ucd-store": minor
"@ucdjs/utils": minor
"@ucdjs/cli": minor
---

Merge LocalUCDStore & RemoteUCDStore into a single UCDStore class which handles everything. Since we are using the new fs-bridge exposed from `@ucdjs/utils` we can easily do this.

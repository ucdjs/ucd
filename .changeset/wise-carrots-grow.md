---
"@ucdjs/fs-bridge": patch
---

Separate required and optional file system operations

File system bridge operations are now split into two interfaces:
- `RequiredFileSystemBridgeOperations`: Core read-only operations (`read`, `listdir`, `exists`) that all bridges must implement
- `OptionalFileSystemBridgeOperations`: Write operations (`write`, `mkdir`, `rm`) that bridges can optionally support

The `optionalCapabilities` map now only tracks optional operations, as required operations are guaranteed to exist. Capability types have been updated to `RequiredCapabilityKey` and `OptionalCapabilityKey` for better type safety.

---
"@ucdjs/ucd-store": minor
---

Store operations now return a result wrapper for improved error handling/reporting.

## What changed
- All core operations (analyze, mirror, clean, repair) now return:
  - `{ success: boolean; data?: TData; errors: StoreError[] }`
  - On failures, `data` is undefined; on success, `data` is present.
- Structured, serializable error payloads via `UCDStoreBaseError` → `StoreError` union.
- Init options renamed: `StoreInitOptions` → `InitOptions` (re-exported).
- `UCDStoreUnsupportedFeature` is an alias to `UCDStoreBridgeUnsupportedOperation`.

## Migration
- Update call sites to read `result.success` and `result.data` instead of bare arrays.
- Handle `result.errors` instead of catching thrown errors for operation failures.
- If you referenced `StoreInitOptions`, switch to `InitOptions`.

## Notes
- Concurrency validations return `{ success: false, data: undefined, errors: [...] }`.
- Not-initialized scenarios no longer throw; they return `{ success: false, data: undefined, errors: [{ type: "NOT_INITIALIZED", ... }] }`.

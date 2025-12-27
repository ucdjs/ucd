---
name: Custom Vitest Matchers
overview: Add custom Vitest matchers to the @ucdjs/test-utils package that work seamlessly across the monorepo. The matchers will cover result tuples, HTTP responses, and error assertions, with full TypeScript support.
todos:
  - id: create-matcher-structure
    content: Create matcher directory structure and index file in packages/test-utils/src/matchers/
    status: pending
  - id: implement-result-tuple-matchers
    content: Implement result tuple matchers (toBeSuccess, toBeError, toHaveError, toHaveErrorMessage)
    status: pending
    dependencies:
      - create-matcher-structure
  - id: implement-response-matchers
    content: Implement HTTP response matchers (toBeSuccessResponse, toBeJsonResponse, toHaveCacheHeaders, toHaveContentType, toBeApiError)
    status: pending
    dependencies:
      - create-matcher-structure
  - id: implement-error-matchers
    content: Implement error matchers (toBeNullError, toBeDefinedError, toHaveErrorType)
    status: pending
    dependencies:
      - create-matcher-structure
  - id: add-typescript-types
    content: Create TypeScript type definitions file extending Vitest Matchers interface
    status: pending
    dependencies:
      - implement-result-tuple-matchers
      - implement-response-matchers
      - implement-error-matchers
  - id: register-matchers
    content: Register matchers in vitest setup file and update exports
    status: pending
    dependencies:
      - add-typescript-types
  - id: add-tests
    content: Add tests for all matchers in packages/test-utils/test/matchers/
    status: pending
    dependencies:
      - register-matchers
  - id: update-package-exports
    content: Update package.json exports to include matchers path
    status: pending
    dependencies:
      - register-matchers
---

# Custom Vitest Matchers Implementation

## Overview

Add custom Vitest matchers to `@ucdjs/test-utils` package that automatically extend Vitest's `expect` API across the entire monorepo. The matchers will be initialized via the existing vitest setup file and include full TypeScript type definitions.

## Architecture

The matchers will be organized in `packages/test-utils/src/matchers/`:

- `result-tuples.ts` - Matchers for `[data, error]` tuple pattern
- `responses.ts` - Matchers for HTTP Response objects  
- `errors.ts` - Matchers for error assertions
- `index.ts` - Main export that registers all matchers
- `types.d.ts` - TypeScript type definitions

The matchers will be automatically registered via `packages/test-utils/src/msw/vitest-setup.ts` (or a new dedicated setup file).

## Implementation Details

### 1. Result Tuple Matchers (`result-tuples.ts`)

Matchers for the common `[data, error]` pattern:

- `toBeSuccess()` - Asserts error is null (data is present)
- `toBeError()` - Asserts error is not null
- `toHaveError(ErrorClass)` - Asserts error is instance of specific class
- `toHaveErrorMessage(pattern)` - Asserts error message matches pattern (string or RegExp)

**Example usage:**

```typescript
const [data, error] = await sync(context);
expect([data, error]).toBeSuccess();
expect([data, error]).toHaveError(UCDStoreVersionNotFoundError);
expect([data, error]).toHaveErrorMessage(/Version.*does not exist/);
```



### 2. HTTP Response Matchers (`responses.ts`)

Matchers for API testing (converting existing helpers in `apps/api/test/helpers/response.ts`):

- `toBeSuccessResponse(options?)` - Asserts status 200 (or custom) and optional headers
- `toBeJsonResponse()` - Asserts content-type contains "application/json"
- `toHaveCacheHeaders(pattern?)` - Asserts cache-control header with optional pattern
- `toHaveContentType(type)` - Asserts content-type (string or RegExp)
- `toBeApiError(options)` - Asserts API error response structure (status, message, timestamp)

**Example usage:**

```typescript
const response = await fetch("/api/v1/versions");
expect(response).toBeSuccessResponse({ status: 200 });
expect(response).toBeJsonResponse();
expect(response).toBeApiError({ status: 404, message: /not found/i });
```



### 3. Error Matchers (`errors.ts`)

Utility matchers for error assertions:

- `toBeNullError()` - More explicit than `toBeNull()` for error checks
- `toBeDefinedError()` - Asserts error is defined (not null/undefined)
- `toHaveErrorType(ErrorClass)` - Asserts error instance type

**Example usage:**

```typescript
expect(error).toBeNullError();
expect(error).toBeDefinedError();
expect(error).toHaveErrorType(UCDStoreGenericError);
```



### 4. TypeScript Support

Create `packages/test-utils/src/matchers/types.d.ts` that extends Vitest's `Matchers` interface (Vitest 3.2+ style):

```typescript
import 'vitest';

interface CustomMatchers<R = unknown> {
  // Result tuple matchers
  toBeSuccess(): R;
  toBeError(): R;
  toHaveError(ErrorClass: new (...args: any[]) => Error): R;
  toHaveErrorMessage(pattern: string | RegExp): R;
  
  // Response matchers
  toBeSuccessResponse(options?: { status?: number; headers?: Record<string, string | RegExp> }): R;
  toBeJsonResponse(): R;
  toHaveCacheHeaders(pattern?: RegExp): R;
  toHaveContentType(type: string | RegExp): R;
  toBeApiError(options: { status: number; message?: string | RegExp }): Promise<R>;
  
  // Error matchers
  toBeNullError(): R;
  toBeDefinedError(): R;
  toHaveErrorType(ErrorClass: new (...args: any[]) => Error): R;
}

declare module 'vitest' {
  interface Matchers<T = any> extends CustomMatchers<T> {}
}
```



### 5. Registration

Add matcher registration to `packages/test-utils/src/msw/vitest-setup.ts` (or create `packages/test-utils/src/matchers/vitest-setup.ts`):

```typescript
import { expect } from 'vitest';
import { extendMatchers } from '../matchers';

extendMatchers(expect);
```

Update `vitest.config.ts` to include the matchers setup file if separate from MSW setup.

### 6. Export Structure

Update `packages/test-utils/src/index.ts` to export matchers:

```typescript
export * from './matchers';
```

Add to `package.json` exports:

```json
"./matchers": "./dist/matchers/index.mjs"
```



## Files to Create/Modify

### New Files:

- `packages/test-utils/src/matchers/index.ts` - Main matcher registration
- `packages/test-utils/src/matchers/result-tuples.ts` - Result tuple matchers
- `packages/test-utils/src/matchers/responses.ts` - HTTP response matchers  
- `packages/test-utils/src/matchers/errors.ts` - Error matchers
- `packages/test-utils/src/matchers/types.d.ts` - TypeScript definitions

### Modified Files:

- `packages/test-utils/src/msw/vitest-setup.ts` - Add matcher registration
- `packages/test-utils/src/index.ts` - Export matchers
- `packages/test-utils/package.json` - Add matchers export path
- `vitest.config.ts` - Ensure setup file includes matchers (if needed)

## Testing Strategy

Add tests for matchers in `packages/test-utils/test/matchers/`:

- Test each matcher with positive and negative cases
- Test TypeScript types compile correctly
- Test integration with existing test patterns

## Migration Path

The matchers are additive - existing tests continue to work. Teams can gradually adopt new matchers:

- Result tuple matchers can replace `expect(error).toBeNull()` patterns
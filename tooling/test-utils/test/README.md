# Contract Tests for setupMockStore

This directory contains contract tests that ensure the `setupMockStore` function accurately mimics the behavior of the real API server.

## Purpose

The contract tests validate that:
- Mock responses match the real API response schemas
- Error handling behavior is consistent 
- HTTP status codes and headers are properly replicated
- Path parameter handling works correctly
- Configuration options behave as expected

## Test Files

### `contract-tests.test.ts`
Core contract tests covering:
- `/api/v1/versions` endpoint response structure
- `/api/v1/versions/:version/file-tree` endpoint behavior  
- `/api/v1/files/:wildcard` endpoint functionality
- `/api/v1/files/.ucd-store.json` endpoint responses
- Response customization and function handlers
- Base URL handling and normalization

### `contract-edge-cases.test.ts`
Edge case and error handling tests covering:
- HTTP status codes (404, 400, 503, etc.)
- Response headers and content types
- Binary data handling
- Complex path parameters with special characters
- Request method restrictions (GET only)
- Multiple base URL configurations
- Data consistency across endpoints

## Running the Tests

```bash
# Run all contract tests
pnpm test --run --project=tooling:contract-tests

# Run specific test file
pnpm exec vitest run tooling/test-utils/test/contract-tests.test.ts
pnpm exec vitest run tooling/test-utils/test/contract-edge-cases.test.ts
```

## Test Coverage

The contract tests ensure coverage of:

### API Endpoints
- ✅ `/api/v1/versions` - List all Unicode versions
- ✅ `/api/v1/versions/:version/file-tree` - Get file tree for version
- ✅ `/api/v1/files/:wildcard` - Fetch files by path  
- ✅ `/api/v1/files/.ucd-store.json` - Get store manifest

### Response Types
- ✅ JSON responses with proper content-type
- ✅ Text/plain responses
- ✅ Binary data (ArrayBuffer, Uint8Array)
- ✅ Error responses with proper status codes
- ✅ Custom headers and cache control

### Configuration Options
- ✅ Custom base URLs
- ✅ Response overrides (boolean, function, data)
- ✅ Version array customization
- ✅ Response disabling functionality

### Error Handling
- ✅ HTTP 404 for missing resources
- ✅ HTTP 400 for invalid requests  
- ✅ HTTP 503 for service errors
- ✅ Unhandled request detection
- ✅ Parameter extraction edge cases

## Adding New Tests

When adding new endpoints or modifying existing behavior:

1. Add tests to verify response schema matches real API
2. Test error conditions and status codes
3. Verify parameter handling works correctly
4. Test any custom configuration options
5. Ensure backwards compatibility

## Integration with CI

These tests are automatically run as part of the test suite via the `tooling:contract-tests` project in `vitest.config.ts`.
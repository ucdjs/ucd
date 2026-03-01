# Pipeline Server API - Sources Domain

## Overview

The Sources Domain provides a hierarchical REST API for browsing and executing pipelines by their source location. Sources represent where pipeline definitions come from - local filesystem directories or remote Git repositories (GitHub/GitLab).

## Base URL

```
/api/sources
```

## URL Structure

The Sources API uses a hierarchical path structure that mirrors the physical organization of pipelines:

```
/api/sources/:sourceId/:fileId/:pipelineId/:executionId/:resource
```

**Hierarchy**:
1. **Source** (`:sourceId`) - Where files come from (filesystem, GitHub, GitLab)
2. **File** (`:fileId`) - Individual pipeline definition file
3. **Pipeline** (`:pipelineId`) - Specific pipeline within the file
4. **Execution** (`:executionId`) - Specific run of a pipeline
5. **Resource** - Data about the execution (logs, events, graph)

---

## Endpoints

### Source Management

#### List All Sources
```
GET /api/sources
```

Returns all configured sources with their metadata.

**Response**:
```typescript
Array<{
  id: string;                    // Unique source identifier
  name: string;                  // Display name
  type: "local" | "github" | "gitlab";
  url?: string;                  // Repository URL (remote sources)
  branch?: string;               // Git branch (remote sources)
  path?: string;                 // Filesystem path (local sources)
  files: File[];                 // Files in this source
  errors?: string[];             // Load errors if any
}>
```

---

#### Get Source Details
```
GET /api/sources/:sourceId
```

Returns detailed information about a specific source including all its files.

**Parameters**:
- `sourceId` (string, required): Source identifier

**Response**: Single source object with full file listing

---

#### Refresh Source Cache
```
POST /api/sources/:sourceId/refresh
```

Refreshes the cache for remote sources (GitHub/GitLab). Re-fetches repository contents and updates pipeline definitions.

**Parameters**:
- `sourceId` (string, required): Source identifier (must be remote)

**Notes**:
- Only works for remote sources (GitHub, GitLab)
- No-op for local filesystem sources

---

### File Operations

#### Get File Details
```
GET /api/sources/:sourceId/:fileId
```

Returns details for a specific file within a source, including all pipelines defined in that file.

**Parameters**:
- `sourceId` (string, required): Source identifier
- `fileId` (string, required): File identifier within the source

**Response**:
```typescript
{
  id: string;                    // File identifier
  path: string;                  // File path within source
  name: string;                  // Display name
  sourceId: string;              // Parent source ID
  pipelines: Pipeline[];         // Pipelines defined in this file
}
```

---

### Pipeline Operations

#### Get Pipeline Details
```
GET /api/sources/:sourceId/:fileId/:pipelineId
```

Returns metadata for a specific pipeline.

**Parameters**:
- `sourceId` (string, required): Source identifier
- `fileId` (string, required): File identifier
- `pipelineId` (string, required): Pipeline identifier

**Response**:
```typescript
{
  id: string;                    // Pipeline identifier
  name: string;                  // Display name
  description?: string;          // Description
  fileId: string;                // Parent file ID
  sourceId: string;              // Source ID
  inputs: InputDefinition[];     // Input parameters
  outputs: OutputDefinition[];   // Output parameters
  config: PipelineConfig;        // Pipeline configuration
}
```

---

#### Get Pipeline Code
```
GET /api/sources/:sourceId/:fileId/:pipelineId/code
```

Returns the raw source code of the pipeline definition file.

**Parameters**:
- `sourceId` (string, required): Source identifier
- `fileId` (string, required): File identifier
- `pipelineId` (string, required): Pipeline identifier

**Response**: Text content of the pipeline definition file

---

#### Execute Pipeline
```
POST /api/sources/:sourceId/:fileId/:pipelineId/execute
```

Executes a pipeline with the provided inputs.

**Parameters**:
- `sourceId` (string, required): Source identifier
- `fileId` (string, required): File identifier
- `pipelineId` (string, required): Pipeline identifier

**Request Body**: Pipeline inputs as JSON object matching the pipeline's input schema

**Response**:
```typescript
{
  id: string;                    // Execution ID (UUID)
  pipelineId: string;            // Pipeline that was executed
  fileId: string;                // File containing pipeline
  sourceId: string;              // Source containing file
  status: "pending" | "running";
  inputs: Record<string, any>;   // Input values provided
  startedAt: string;             // ISO 8601 timestamp
}
```

**Constraints**:
- Execution is **only available for local filesystem sources**
- Remote sources (GitHub/GitLab) cannot be executed
- Returns immediately with execution ID (async execution)
- Execution history is persisted to database

---

#### List Pipeline Executions
```
GET /api/sources/:sourceId/:fileId/:pipelineId/executions
```

Returns execution history for a specific pipeline.

**Parameters**:
- `sourceId` (string, required): Source identifier
- `fileId` (string, required): File identifier
- `pipelineId` (string, required): Pipeline identifier

**Query Parameters**:
- `limit` (number, optional): Maximum results (default: 50)
- `offset` (number, optional): Pagination offset (default: 0)

**Response**:
```typescript
Array<{
  id: string;                    // Execution ID
  pipelineId: string;
  fileId: string;
  sourceId: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  inputs: Record<string, any>;
  outputs?: Record<string, any>;
  startedAt: string;             // ISO 8601
  completedAt?: string;          // ISO 8601
  error?: string;
}>
```

---

### Execution Details

#### Get Execution
```
GET /api/sources/:sourceId/:fileId/:pipelineId/executions/:executionId
```

Returns full details for a specific execution.

**Parameters**:
- `sourceId` (string, required): Source identifier
- `fileId` (string, required): File identifier
- `pipelineId` (string, required): Pipeline identifier
- `executionId` (string, required): Execution UUID

**Response**: Complete execution record with inputs, outputs, timing, and status

---

#### Get Execution Events
```
GET /api/sources/:sourceId/:fileId/:pipelineId/executions/:executionId/events
```

Returns lifecycle events for an execution (start, complete, step transitions, errors).

**Parameters**:
- `sourceId` (string, required): Source identifier
- `fileId` (string, required): File identifier
- `pipelineId` (string, required): Pipeline identifier
- `executionId` (string, required): Execution UUID

**Response**:
```typescript
Array<{
  id: string;                    // Event ID
  executionId: string;
  type: "execution.started" | "execution.completed" | "execution.failed" | 
        "step.started" | "step.completed" | "step.failed";
  timestamp: string;             // ISO 8601
  data?: Record<string, any>;    // Event-specific data
}>
```

---

#### Get Execution Logs
```
GET /api/sources/:sourceId/:fileId/:pipelineId/executions/:executionId/logs
```

Returns log entries from pipeline execution.

**Parameters**:
- `sourceId` (string, required): Source identifier
- `fileId` (string, required): File identifier
- `pipelineId` (string, required): Pipeline identifier
- `executionId` (string, required): Execution UUID

**Query Parameters**:
- `limit` (number, optional): Maximum log entries
- `offset` (number, optional): Pagination offset

**Response**:
```typescript
Array<{
  id: string;                    // Log entry ID
  executionId: string;
  timestamp: string;             // ISO 8601
  level: "debug" | "info" | "warn" | "error";
  message: string;
  span?: string;                 // Trace/span identifier
  metadata?: Record<string, any>;
}>
```

---

#### Get Execution Graph
```
GET /api/sources/:sourceId/:fileId/:pipelineId/executions/:executionId/graph
```

Returns execution graph data for visualization.

**Parameters**:
- `sourceId` (string, required): Source identifier
- `fileId` (string, required): File identifier
- `pipelineId` (string, required): Pipeline identifier
- `executionId` (string, required): Execution UUID

**Response**: Graph structure with nodes (steps) and edges (dependencies) including execution status per node

---

## Route File Organization

Server route files are organized by resource depth:

| File | Endpoints | Resource Level |
|------|-----------|----------------|
| `sources.index.ts` | `GET /`, `GET /:sourceId` | Source |
| `sources.source.ts` | `GET /:sourceId/:fileId` | File |
| `sources.file.ts` | `GET /:sourceId/:fileId/:pipelineId` | Pipeline (details) |
| `sources.pipeline.ts` | Code, Execute, List Executions | Pipeline (operations) |
| `sources.execution.ts` | Execution details, Events, Logs, Graph | Execution |
| `sources.refresh.ts` | `POST /:sourceId/refresh` | Source operation |

**Organization Principle**: Each URL path segment depth gets its own file. Operations on the same resource level are grouped together.

---

## Source Types

### Local Filesystem (`type: "local"`)
- **Path**: Local directory on server filesystem
- **Execution**: ✅ Can execute pipelines
- **Refresh**: ❌ Not applicable
- **Use Case**: Development, testing, private pipelines

### GitHub Repository (`type: "github"`)
- **URL**: GitHub repository URL
- **Branch**: Specific git branch
- **Execution**: ❌ Cannot execute (read-only)
- **Refresh**: ✅ Manual cache refresh required
- **Use Case**: Public pipeline catalogs, version-controlled definitions

### GitLab Repository (`type: "gitlab"`)
- **URL**: GitLab repository URL
- **Branch**: Specific git branch
- **Execution**: ❌ Cannot execute (read-only)
- **Refresh**: ✅ Manual cache refresh required
- **Use Case**: Enterprise pipeline catalogs, private repos

---

## Error Handling

**Status Codes**:
- `200` - Success
- `400` - Bad Request (invalid parameters)
- `404` - Not Found (source/file/pipeline/execution doesn't exist)
- `500` - Internal Server Error

**Error Response**:
```json
{
  "error": "Description of what went wrong"
}
```

---

## Common Patterns

### Execute and Monitor

1. **Start execution**:
   ```
   POST /api/sources/local/data/transform.yaml/etl-pipeline/execute
   Body: { "inputFile": "data.csv", "outputTable": "results" }
   ```

2. **Poll for completion**:
   ```
   GET /api/sources/local/data/transform.yaml/etl-pipeline/executions/{executionId}
   ```

3. **Fetch logs**:
   ```
   GET /api/sources/local/data/transform.yaml/etl-pipeline/executions/{executionId}/logs
   ```

### Browse Hierarchy

1. **List sources**:
   ```
   GET /api/sources
   ```

2. **Get source files**:
   ```
   GET /api/sources/github-myorg/pipelines
   ```

3. **Get file pipelines**:
   ```
   GET /api/sources/github-myorg/pipelines/data/etl.yaml
   ```

4. **Get pipeline details**:
   ```
   GET /api/sources/github-myorg/pipelines/data/etl.yaml/transform-pipeline
   ```

---

## Client Route Mapping

Client routes mirror the API structure:

| Client Route | API Endpoint |
|--------------|--------------|
| `/$sourceId` | `GET /api/sources/:sourceId` |
| `/$sourceId/$fileId` | `GET /api/sources/:sourceId/:fileId` |
| `/$sourceId/$fileId/$pipelineId` | `GET /api/sources/:sourceId/:fileId/:pipelineId` |
| `/$sourceId/$fileId/$pipelineId/code` | `GET /api/sources/:sourceId/:fileId/:pipelineId/code` |
| `/$sourceId/$fileId/$pipelineId/executions` | `GET /api/sources/:sourceId/:fileId/:pipelineId/executions` |
| `/$sourceId/$fileId/$pipelineId/executions/$executionId` | `GET /api/sources/.../executions/:executionId` |
| `/$sourceId/$fileId/$pipelineId/executions/$executionId/logs` | `GET /api/sources/.../executions/:executionId/logs` |
| `/$sourceId/$fileId/$pipelineId/executions/$executionId/graph` | `GET /api/sources/.../executions/:executionId/graph` |

---

## Key Terms

- **Source**: Origin of pipeline files (filesystem, GitHub, GitLab)
- **File**: Individual YAML/JSON file containing pipeline definitions
- **Pipeline**: Single executable workflow definition
- **Execution**: Single run of a pipeline
- **Event**: Lifecycle marker (started, completed, failed)
- **Log**: Output message from pipeline execution
- **Graph**: Visual representation of pipeline structure and execution flow

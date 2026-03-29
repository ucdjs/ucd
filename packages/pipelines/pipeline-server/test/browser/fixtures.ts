export function buildConfigResponse(overrides: Partial<{
  workspaceId: string;
  version: string;
}> = {}) {
  return {
    workspaceId: "workspace-123",
    version: "16.0.0",
    ...overrides,
  };
}

export function buildSourceSummary(overrides: Partial<{
  id: string;
  type: "local" | "github" | "gitlab";
  label: string;
  fileCount: number;
  pipelineCount: number;
  errors: Array<Record<string, unknown>>;
}> = {}) {
  return {
    id: "local",
    type: "local" as const,
    label: "Local Source",
    fileCount: 1,
    pipelineCount: 1,
    errors: [],
    ...overrides,
  };
}

export function buildPipelineSummary(overrides: Partial<{
  id: string;
  name: string;
  description: string;
  versions: string[];
  routeCount: number;
  sourceCount: number;
  sourceId: string;
}> = {}) {
  return {
    id: "main-pipeline",
    name: "Main pipeline",
    description: "Build and publish",
    versions: ["16.0.0"],
    routeCount: 1,
    sourceCount: 1,
    sourceId: "local",
    ...overrides,
  };
}

export function buildSourceFile(overrides: Partial<{
  id: string;
  path: string;
  label: string;
  pipelines: Array<ReturnType<typeof buildPipelineSummary>>;
}> = {}) {
  return {
    id: "alpha",
    path: "src/alpha.ts",
    label: "Alpha file",
    pipelines: [buildPipelineSummary()],
    ...overrides,
  };
}

export function buildSourceResponse(overrides: Partial<{
  id: string;
  type: "local" | "github" | "gitlab";
  label: string;
  errors: Array<Record<string, unknown>>;
  files: Array<ReturnType<typeof buildSourceFile>>;
}> = {}) {
  return {
    id: "local",
    type: "local" as const,
    label: "Local Source",
    errors: [],
    files: [buildSourceFile()],
    ...overrides,
  };
}

export function buildOverviewResponse(overrides: Partial<{
  activity: unknown[];
  summary: {
    total: number;
    pending: number;
    running: number;
    completed: number;
    failed: number;
    cancelled: number;
  };
  recentExecutions: unknown[];
}> = {}) {
  return {
    activity: [],
    summary: {
      total: 0,
      pending: 0,
      running: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
    },
    recentExecutions: [],
    ...overrides,
  };
}

export function buildPipelineResponse(overrides: Partial<{
  id: string;
  name: string;
  description: string;
  include: string | undefined;
  versions: string[];
  routeCount: number;
  sourceCount: number;
  routes: Array<Record<string, unknown>>;
  sources: Array<{ id: string }>;
}> = {}) {
  return {
    id: "main-pipeline",
    name: "Main pipeline",
    description: "Build and publish",
    include: undefined,
    versions: ["16.0.0"],
    routeCount: 1,
    sourceCount: 1,
    routes: [],
    sources: [{ id: "local" }],
    ...overrides,
  };
}

export function buildExecutionSummaryItem(overrides: Partial<{
  id: string;
  sourceId: string;
  fileId: string;
  pipelineId: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  versions: string[];
  summary: {
    versions: string[];
    totalRoutes: number;
    cached: number;
    totalFiles: number;
    matchedFiles: number;
    skippedFiles: number;
    fallbackFiles: number;
    totalOutputs: number;
    durationMs: number;
  };
  hasGraph: boolean;
  error: string | null;
}> = {}) {
  return {
    id: "exec-1",
    sourceId: "local",
    fileId: "alpha",
    pipelineId: "main-pipeline",
    status: "completed",
    startedAt: "2026-03-20T10:00:00.000Z",
    completedAt: "2026-03-20T10:01:00.000Z",
    versions: ["16.0.0"],
    summary: {
      versions: ["16.0.0"],
      totalRoutes: 1,
      cached: 0,
      totalFiles: 1,
      matchedFiles: 1,
      skippedFiles: 0,
      fallbackFiles: 0,
      totalOutputs: 0,
      durationMs: 60_000,
    },
    hasGraph: true,
    error: null,
    ...overrides,
  };
}

export function buildExecutionsResponse(
  executions: Array<ReturnType<typeof buildExecutionSummaryItem>> = [],
  overrides: Partial<{
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }> = {},
) {
  return {
    executions,
    pagination: {
      total: executions.length,
      limit: 50,
      offset: 0,
      hasMore: false,
    },
    ...overrides,
  };
}

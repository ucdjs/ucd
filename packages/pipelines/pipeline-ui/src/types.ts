/**
 * Summary information about a pipeline for list views
 */
export interface PipelineInfo {
  id: string;
  name?: string;
  description?: string;
  versions: string[];
  routeCount: number;
  sourceCount: number;
}

/**
 * Detailed pipeline information including routes and sources
 */
export interface PipelineDetails {
  id: string;
  name?: string;
  description?: string;
  versions: string[];
  routeCount: number;
  sourceCount: number;
  routes: Array<{ id: string; cache: boolean }>;
  sources: Array<{ id: string }>;
}

/**
 * Error that occurred while loading a pipeline file
 */
export interface LoadError {
  filePath: string;
  message: string;
}

/**
 * Response from the pipelines list endpoint
 */
export interface PipelinesResponse {
  pipelines: PipelineInfo[];
  cwd: string;
  errors: LoadError[];
}

/**
 * Response from the single pipeline endpoint
 */
export interface PipelineResponse {
  pipeline?: PipelineDetails;
  error?: string;
}

/**
 * Result of pipeline execution
 */
export interface ExecuteResult {
  success: boolean;
  pipelineId: string;
  summary?: {
    totalRoutes: number;
    successfulRoutes: number;
    failedRoutes: number;
    totalTime: number;
  };
  errors?: Array<{ scope: string; message: string }>;
  error?: string;
}

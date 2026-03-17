export interface ExecuteResult {
  success: boolean;
  pipelineId: string;
  executionId?: string;
  error?: string;
}

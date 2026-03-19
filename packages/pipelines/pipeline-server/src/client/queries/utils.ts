import type { ExecutionStatus } from "@ucdjs/pipelines-executor/shared";

export function isNotFoundError(error: unknown): error is Error & { status: number } {
  return error instanceof Error
    && "status" in error
    && typeof error.status === "number"
    && error.status === 404;
}

export function isExecutionActive(status: ExecutionStatus | null | undefined) {
  return status === "pending" || status === "running";
}

export function refetchWhileExecutionActive(
  query: { state: { data: { status?: ExecutionStatus } | undefined } },
  intervalMs = 2_000,
) {
  return isExecutionActive(query.state.data?.status) ? intervalMs : false;
}

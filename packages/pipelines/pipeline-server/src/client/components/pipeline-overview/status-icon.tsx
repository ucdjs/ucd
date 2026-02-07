import type { ExecutionStatus } from "#lib/pipeline-executions";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

export function StatusIcon({ status }: { status: ExecutionStatus }) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "failed":
      return <XCircle className="h-4 w-4 text-red-500" />;
    case "running":
      return <Clock className="h-4 w-4 text-yellow-500 animate-pulse" />;
    default:
      return <Clock className="h-4 w-4 text-gray-400" />;
  }
}

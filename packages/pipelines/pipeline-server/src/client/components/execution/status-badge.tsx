import type { ExecutionStatus } from "@ucdjs/pipelines-executor";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";

export function StatusBadge({ status }: { status: ExecutionStatus }) {
  switch (status) {
    case "completed":
      return (
        <Badge variant="outline" className="border-green-200 bg-green-50 text-xs text-green-700">
          Success
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="outline" className="border-red-200 bg-red-50 text-xs text-red-700">
          Failed
        </Badge>
      );
    case "running":
      return (
        <Badge variant="outline" className="border-yellow-200 bg-yellow-50 text-xs text-yellow-700">
          Running
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-xs">
          {status}
        </Badge>
      );
  }
}

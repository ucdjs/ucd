import type { ExecutionStatus } from "#lib/pipeline-executions";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";

export function StatusBadge({ status }: { status: ExecutionStatus }) {
  switch (status) {
    case "completed":
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
          Success
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
          Failed
        </Badge>
      );
    case "running":
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs">
          Running
        </Badge>
      );
  }
}

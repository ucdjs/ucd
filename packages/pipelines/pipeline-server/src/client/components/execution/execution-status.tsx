import type { ExecutionStatus } from "@ucdjs/pipelines-executor";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

export function StatusIcon({ status }: { status: ExecutionStatus }) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "failed":
      return <XCircle className="h-4 w-4 text-red-500" />;
    case "running":
      return <Clock className="h-4 w-4 animate-pulse text-yellow-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-400" />;
  }
}

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

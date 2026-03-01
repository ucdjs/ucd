import type { LoadError } from "@ucdjs/pipelines-ui";
import { useHotkey } from "@tanstack/react-hotkeys";
import { AlertTriangle, ChevronDown, ChevronUp, Clock, Copy, FileWarning, X, XCircle } from "lucide-react";
import { useMemo, useState } from "react";

interface ErrorLogPanelProps {
  errors: LoadError[];
  isOpen: boolean;
  onClose: () => void;
  onDismiss: (error: LoadError) => void;
  onClearAll: () => void;
}

export function ErrorLogPanel({ errors, isOpen, onClose, onDismiss, onClearAll }: ErrorLogPanelProps) {
  useHotkey("Escape", () => {
    if (isOpen) onClose();
  });

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[480px] max-w-[90vw]">
      <div className="bg-background border border-border rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="font-medium text-sm">
              {errors.length} Error{errors.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onClearAll}
              className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              title="Dismiss all errors"
            >
              Clear all
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-muted rounded transition-colors"
              title="Close (Esc)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Error List */}
        <div className="max-h-[60vh] overflow-y-auto">
          {errors.map((error, index) => (
            <ErrorItem
              key={`${error.sourceId}-${error.filePath}-${index}`}
              error={error}
              onDismiss={() => onDismiss(error)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ErrorItem({ error, onDismiss }: { error: LoadError; onDismiss: () => void }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const timestamp = useMemo(() => {
    return new Date().toLocaleTimeString();
  }, []);

  const handleCopy = async () => {
    const errorText = `[${timestamp}] ${error.sourceId || "unknown"}: ${error.filePath}\n${error.message}`;
    await navigator.clipboard.writeText(errorText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const severity = getErrorSeverity(error);

  return (
    <div className="border-b border-border last:border-b-0">
      <div
        className="flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="mt-0.5">
          {severity === "critical" && <XCircle className="h-4 w-4 text-destructive" />}
          {severity === "error" && <FileWarning className="h-4 w-4 text-orange-500" />}
          {severity === "warning" && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-muted-foreground uppercase">
              {error.sourceId || "system"}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timestamp}
            </span>
          </div>
          <p className="text-sm text-foreground truncate">
            {error.filePath}
          </p>
          <p className="text-xs text-destructive mt-1 line-clamp-2">
            {error.message}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCopy();
            }}
            className="p-1.5 hover:bg-muted rounded transition-colors"
            title="Copy error details"
          >
            {copied ? (
              <span className="text-xs text-green-500">Copied!</span>
            ) : (
              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
            className="p-1.5 hover:bg-muted rounded transition-colors"
            title="Dismiss"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-4 pb-3 pt-0 bg-muted/30">
          <div className="pl-7">
            <div className="text-xs text-muted-foreground space-y-1">
              <p><span className="font-medium">Source:</span> {error.sourceId || "N/A"}</p>
              <p><span className="font-medium">File:</span> {error.filePath}</p>
              <div className="bg-muted rounded p-2 mt-2">
                <p className="font-medium mb-1">Error Message:</p>
                <p className="text-destructive whitespace-pre-wrap">{error.message}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getErrorSeverity(error: LoadError): "critical" | "error" | "warning" {
  if (error.sourceId === "system") return "critical";
  if (error.message.includes("parse") || error.message.includes("syntax")) return "error";
  return "warning";
}

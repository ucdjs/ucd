import { cn } from "@ucdjs-internal/shared-ui";
import { Button } from "@ucdjs-internal/shared-ui/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";
import { Skeleton } from "@ucdjs-internal/shared-ui/ui/skeleton";
import { Check, Download, ExternalLink, FileText, Link2, Loader2 } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface FileViewerProps {
  content: string;
  contentType: string;
  fileName: string;
  /** Absolute URL to the raw file */
  fileUrl: string;
}

export interface LineSelection {
  start: number;
  end: number;
}

/**
 * Parse line selection from URL hash
 * Supports: #L5, #L5-L10, #L5-10
 */
function parseLineHash(hash: string): LineSelection | null {
  if (!hash || !hash.startsWith("#L")) return null;

  const match = hash.match(/^#L(\d+)(?:-L?(\d+))?$/);
  if (!match) return null;

  const start = Number.parseInt(match[1]!, 10);
  const end = match[2] ? Number.parseInt(match[2], 10) : start;

  if (Number.isNaN(start) || Number.isNaN(end)) return null;

  return {
    start: Math.min(start, end),
    end: Math.max(start, end),
  };
}

/**
 * Generate URL hash from line selection
 */
function generateLineHash(selection: LineSelection): string {
  if (selection.start === selection.end) {
    return `#L${selection.start}`;
  }
  return `#L${selection.start}-L${selection.end}`;
}

function getLanguageFromContentType(contentType: string, fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";

  // Check content type first
  if (contentType.includes("json")) return "json";
  if (contentType.includes("xml")) return "xml";
  if (contentType.includes("html")) return "html";
  if (contentType.includes("csv")) return "csv";

  // Fall back to extension
  switch (ext) {
    case "txt":
      return "plaintext";
    case "json":
      return "json";
    case "xml":
      return "xml";
    case "html":
    case "htm":
      return "html";
    case "csv":
      return "csv";
    case "md":
      return "markdown";
    default:
      return "plaintext";
  }
}

// Memoized line number component
interface LineNumberProps {
  lineNum: number;
  selected: boolean;
  onClick: (lineNum: number, event: React.MouseEvent) => void;
  onRef?: (lineNum: number, el: HTMLDivElement | null) => void;
}

function LineNumberComponent({ lineNum, selected, onClick, onRef }: LineNumberProps) {
  const handleClick = useCallback((e: React.MouseEvent) => {
    onClick(lineNum, e);
  }, [lineNum, onClick]);

  const handleRef = useCallback((el: HTMLDivElement | null) => {
    onRef?.(lineNum, el);
  }, [lineNum, onRef]);

  return (
    <div
      ref={handleRef}
      onClick={handleClick}
      className={cn(
        "px-3 py-0 leading-5 cursor-pointer hover:bg-primary/10",
        selected && "bg-primary/20 text-primary font-medium",
      )}
    >
      {lineNum}
    </div>
  );
}

const LineNumber = memo(LineNumberComponent);

// Memoized line content component
interface LineContentProps {
  line: string;
  selected: boolean;
}

function LineContentComponent({ line, selected }: LineContentProps) {
  return (
    <pre
      className={cn(
        "px-3 py-0 leading-5 whitespace-pre m-0",
        selected && "bg-primary/10",
      )}
    >
      {line || " "}
    </pre>
  );
}

const LineContent = memo(LineContentComponent);

export function FileViewer({ content, contentType, fileName, fileUrl }: FileViewerProps) {
  const language = getLanguageFromContentType(contentType, fileName);
  const lines = useMemo(() => content.split("\n"), [content]);
  const lineCount = lines.length;

  // Parse initial selection from URL hash (only on mount)
  const initialSelection = useMemo((): LineSelection | null => {
    if (typeof window === "undefined") return null;
    const hash = window.location.hash;
    const parsed = parseLineHash(hash);
    if (parsed && parsed.start <= lineCount && parsed.end <= lineCount) {
      return parsed;
    }
    return null;
  }, [lineCount]);

  const [selection, setSelection] = useState<LineSelection | null>(initialSelection);
  const [lastClickedLine, setLastClickedLine] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const lineRefsRef = useRef<Map<number, HTMLDivElement>>(new Map());

  // Scroll to selection when it changes
  useEffect(() => {
    if (selection) {
      const lineElement = lineRefsRef.current.get(selection.start);
      if (lineElement) {
        lineElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [selection]);

  // Update URL hash when selection changes
  useEffect(() => {
    if (selection) {
      const hash = generateLineHash(selection);
      window.history.replaceState(null, "", hash);
    }
  }, [selection]);

  const handleLineClick = useCallback((lineNum: number, event: React.MouseEvent) => {
    if (event.shiftKey && lastClickedLine !== null) {
      // Range selection with shift+click
      setSelection({
        start: Math.min(lastClickedLine, lineNum),
        end: Math.max(lastClickedLine, lineNum),
      });
    } else {
      // Single line selection
      setSelection({ start: lineNum, end: lineNum });
      setLastClickedLine(lineNum);
    }
  }, [lastClickedLine]);

  const handleLineRef = useCallback((lineNum: number, el: HTMLDivElement | null) => {
    if (el) {
      lineRefsRef.current.set(lineNum, el);
    } else {
      lineRefsRef.current.delete(lineNum);
    }
  }, []);

  // Memoize selection bounds for O(1) check in render
  const selectionStart = selection?.start ?? -1;
  const selectionEnd = selection?.end ?? -1;

  const handleCopyLink = useCallback(async () => {
    if (!selection) return;

    const url = `${window.location.origin}${window.location.pathname}${generateLineHash(selection)}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [selection]);

  function handleDownload() {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {lineCount}
            {" "}
            {lineCount === 1 ? "line" : "lines"}
            {" "}
            •
            {" "}
            {language}
          </span>
          {selection && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              title="Copy link to selected lines"
            >
              {copied ? <Check className="size-4" /> : <Link2 className="size-4" />}
              {copied ? "Copied!" : "Copy Link"}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={(
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="size-4" />
                Open Raw
              </a>
            )}
          />
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="size-4" />
            Download
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative rounded-lg border border-border bg-muted/30 overflow-hidden">
          <div className="flex">
            {/* Line numbers */}
            <div className="shrink-0 select-none border-r border-border bg-muted/50 text-right text-xs text-muted-foreground font-mono">
              {lines.map((_, idx) => {
                const lineNum = idx + 1;
                const selected = lineNum >= selectionStart && lineNum <= selectionEnd;
                return (
                  <LineNumber
                    key={lineNum}
                    lineNum={lineNum}
                    selected={selected}
                    onClick={handleLineClick}
                    onRef={handleLineRef}
                  />
                );
              })}
            </div>
            {/* Content */}
            <div className="flex-1 overflow-x-auto text-sm font-mono">
              {lines.map((line, idx) => {
                const lineNum = idx + 1;
                const selected = lineNum >= selectionStart && lineNum <= selectionEnd;
                return (
                  <LineContent
                    key={lineNum}
                    line={line}
                    selected={selected}
                  />
                );
              })}
            </div>
          </div>
        </div>
        {selection && (
          <p className="mt-2 text-xs text-muted-foreground">
            {selection.start === selection.end
              ? `Line ${selection.start} selected`
              : `Lines ${selection.start}-${selection.end} selected (${selection.end - selection.start + 1} lines)`}
            {" "}
            • Click to select, Shift+click for range
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export interface FileViewerSkeletonProps {
  fileName: string;
}

/**
 * Skeleton loading state for FileViewer
 * Shows the card shell with loading placeholders for content
 */
export function FileViewerSkeleton({ fileName }: FileViewerSkeletonProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <FileText className="size-4" />
          {fileName}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-20" />
          <Button variant="outline" size="sm" disabled>
            <ExternalLink className="size-4" />
            Open Raw
          </Button>
          <Button variant="outline" size="sm" disabled>
            <Download className="size-4" />
            Download
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative rounded-lg border border-border bg-muted/30 overflow-hidden">
          <div className="flex">
            {/* Line numbers skeleton */}
            <div className="shrink-0 select-none border-r border-border bg-muted/50 text-right text-xs text-muted-foreground font-mono w-12">
              {Array.from({ length: 15 }).map((_, idx) => (
                // eslint-disable-next-line react/no-array-index-key
                <div key={`skeleton-line-${idx}`} className="px-3 py-0 leading-5">
                  <Skeleton className="h-3 w-4 ml-auto" />
                </div>
              ))}
            </div>
            {/* Content skeleton */}
            <div className="flex-1 overflow-x-auto text-sm font-mono p-3 space-y-1">
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Loading file content...</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

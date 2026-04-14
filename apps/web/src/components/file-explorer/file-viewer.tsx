import { cn } from "@ucdjs-internal/shared-ui";
import { Button, Skeleton } from "@ucdjs-internal/shared-ui/components";
import { Check, Download, ExternalLink, FileText, Link2, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const LINE_HASH_RE = /^#L(\d+)(?:-L?(\d+))?$/;
const HTML_LINE_CLASS_RE = /class="line"/g;

export interface FileViewerProps {
  html: string;
  fileName: string;
  /** Absolute URL to the raw file */
  fileUrl: string;
  onDownload: () => void;
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

  const match = hash.match(LINE_HASH_RE);
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

function countLinesFromHtml(html: string) {
  if (!html) return 0;
  const matches = html.match(HTML_LINE_CLASS_RE);
  return matches ? matches.length : 0;
}

export function FileViewer({
  html,
  fileUrl,
  fileName,
  onDownload,
}: FileViewerProps) {
  const lineCount = useMemo(() => countLinesFromHtml(html), [html]);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const lineElementsRef = useRef<HTMLElement[]>([]);
  const shouldAutoScrollRef = useRef(false);

  // Parse initial selection from URL hash (only on mount)
  const [selection, setSelection] = useState<LineSelection | null>(null);
  const [lastClickedLine, setLastClickedLine] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const lines = [...container.querySelectorAll<HTMLElement>(".line")];
    lineElementsRef.current = lines;
    lines.forEach((line, index) => {
      line.dataset.line = String(index + 1);
      line.classList.add("file-viewer-line");
    });
  }, [html]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const parsed = parseLineHash(window.location.hash);
    if (parsed && parsed.start <= lineCount && parsed.end <= lineCount) {
      shouldAutoScrollRef.current = true;
      setSelection(parsed);
      setLastClickedLine(parsed.start);
    } else {
      shouldAutoScrollRef.current = false;
      setSelection(null);
      setLastClickedLine(null);
    }
  }, [html, lineCount]);

  useEffect(() => {
    const lines = lineElementsRef.current;
    if (!lines.length) return;

    const selectionStart = selection?.start ?? -1;
    const selectionEnd = selection?.end ?? -1;

    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const isSelected = lineNum >= selectionStart && lineNum <= selectionEnd;
      line.classList.toggle("is-selected", isSelected);
    });
  }, [selection]);

  useEffect(() => {
    if (!selection || !shouldAutoScrollRef.current) return;
    const lineElement = lineElementsRef.current[selection.start - 1];
    if (lineElement) {
      lineElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    shouldAutoScrollRef.current = false;
  }, [selection]);

  const handleLineClick = useCallback((lineNum: number, event: React.MouseEvent) => {
    let nextSelection: LineSelection;
    if (event.shiftKey && lastClickedLine !== null) {
      // Range selection with shift+click
      nextSelection = {
        start: Math.min(lastClickedLine, lineNum),
        end: Math.max(lastClickedLine, lineNum),
      };
    } else {
      // Single line selection
      nextSelection = { start: lineNum, end: lineNum };
      setLastClickedLine(lineNum);
    }
    setSelection(nextSelection);
    if (typeof window !== "undefined") {
      const nextUrl = `${window.location.pathname}${window.location.search}${generateLineHash(nextSelection)}`;
      window.history.replaceState(null, "", nextUrl);
    }
    shouldAutoScrollRef.current = false;
  }, [lastClickedLine]);

  // Memoize selection bounds for O(1) check in render
  const selectionStart = selection?.start ?? -1;
  const selectionEnd = selection?.end ?? -1;

  const handleCopyLink = useCallback(async () => {
    if (!selection || typeof navigator === "undefined" || !navigator.clipboard) return;

    const url = `${window.location.origin}${window.location.pathname}${generateLineHash(selection)}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(setCopied, 2000, false);
  }, [selection]);

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background">
      <div className="flex min-h-11 flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/20 px-3 py-2">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <div className="flex min-w-0 items-center gap-2">
            <FileText className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate text-sm font-medium" title={fileName}>
              {fileName}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {lineCount}
            {" "}
            {lineCount === 1 ? "line" : "lines"}
          </span>
          {selection && (
            <span className="text-xs text-muted-foreground">
              {selection.start === selection.end
                ? `Line ${selection.start} selected`
                : `Lines ${selection.start}-${selection.end} selected`}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
            title="Open raw file (Mod+Shift+O)"
            render={(
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="size-4" />
                Open Raw
                <span className="hidden rounded border border-border/60 px-1 py-0.5 font-mono text-[10px] text-muted-foreground md:inline">Mod+Shift+O</span>
              </a>
            )}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={onDownload}
            title="Download file (Mod+Shift+B)"
          >
            <Download className="size-4" />
            Download
            <span className="hidden rounded border border-border/60 px-1 py-0.5 font-mono text-[10px] text-muted-foreground md:inline">Mod+Shift+B</span>
          </Button>
        </div>
      </div>
      <div className="px-0">
        <div className="relative bg-muted/30 overflow-hidden">
          <div className="flex">
            {/* Line numbers */}
            <div className="shrink-0 select-none border-r border-border bg-muted/50 text-right text-xs text-muted-foreground font-mono">
              {Array.from({ length: lineCount }).map((_, idx) => {
                const lineNum = idx + 1;
                const selected = lineNum >= selectionStart && lineNum <= selectionEnd;
                return (
                  <button
                    key={lineNum}
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      handleLineClick(lineNum, event);
                    }}
                    className={cn(
                      "block px-3 py-0 leading-5 cursor-pointer hover:bg-primary/10",
                      selected && "bg-primary/20 text-primary font-medium",
                    )}
                  >
                    {lineNum}
                  </button>
                );
              })}
            </div>
            {/* Content */}
            <div className="flex-1 overflow-x-auto text-sm font-mono px-3">
              <div
                ref={contentRef}
                className="file-viewer-shiki"
                dangerouslySetInnerHTML={{ __html: `<pre>${html}</pre>` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
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
    <div className="overflow-hidden rounded-lg border border-border bg-background">
      <div className="flex min-h-11 flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/20 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2 text-sm font-medium">
          <FileText className="size-4" />
          {fileName}
        </div>
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
      </div>
      <div>
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
      </div>
    </div>
  );
}

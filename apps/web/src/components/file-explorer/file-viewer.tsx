import { Download, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface FileViewerProps {
  content: string;
  contentType: string;
  fileName: string;
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

export function FileViewer({ content, contentType, fileName }: FileViewerProps) {
  const language = getLanguageFromContentType(contentType, fileName);
  const lineCount = content.split("\n").length;

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
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <FileText className="size-4" />
          {fileName}
        </CardTitle>
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
            <div className="flex-shrink-0 select-none border-r border-border bg-muted/50 px-3 py-3 text-right text-xs text-muted-foreground font-mono">
              {Array.from({ length: lineCount }, (_, i) => i + 1).map((lineNum) => (
                <div key={`line-${lineNum}`} className="leading-5">
                  {lineNum}
                </div>
              ))}
            </div>
            {/* Content */}
            <pre className="flex-1 overflow-x-auto p-3 text-sm font-mono leading-5 whitespace-pre">
              {content}
            </pre>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

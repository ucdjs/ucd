import { Button, Card, CardContent, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/components";
import { Download, FileWarning } from "lucide-react";
import { getFileTypeDescription } from "../../lib/file-explorer";

export interface NonRenderableFileProps {
  fileName: string;
  contentType: string;
  onDownload: () => void;
}

export function NonRenderableFile({
  fileName,
  contentType,
  onDownload,
}: NonRenderableFileProps) {
  const fileType = getFileTypeDescription(fileName);
  const ext = fileName.split(".").pop()?.toLowerCase() || "";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileWarning className="size-5 text-amber-500" />
          {fileName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-12 text-center gap-6">
          <div className="rounded-md bg-muted p-6">
            <FileWarning className="size-12 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Cannot preview this file</h3>
            <p className="text-muted-foreground max-w-md">
              This
              {" "}
              <span className="font-medium">{fileType}</span>
              {" "}
              (
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                .
                {ext}
              </code>
              ) cannot be displayed in the browser.
            </p>
            {contentType && (
              <p className="text-xs text-muted-foreground/70">
                Content-Type:
                {" "}
                {contentType}
              </p>
            )}
          </div>
          <Button
            title="Download file (Mod+Shift+B)"
            onClick={onDownload}
            type="button"
          >
            <Download className="size-4" />
            Download File
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

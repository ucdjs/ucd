import { Button } from "@ucdjs-internal/shared-ui/components";
import { Download, FileDown } from "lucide-react";
import { formatFileSize, PREVIEW_LIMIT_LABEL } from "../../lib/file-explorer";

export interface LargeFileWarningProps {
  fileName: string;
  size: number;
  downloadUrl: string;
  contentType: string;
}

export function LargeFileWarning({ fileName, size, downloadUrl, contentType }: LargeFileWarningProps) {
  const fileSize = formatFileSize(size);

  return (
    <div className="flex min-h-80 items-center justify-center rounded-lg border border-border bg-background p-6">
      <div className="w-full max-w-2xl space-y-6">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40">
            <FileDown className="size-7 text-primary" />
          </div>

          <div className="min-w-0 space-y-2">
            <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-center">
              <h3 className="text-lg font-semibold leading-tight">
                File too large to preview
              </h3>
              <span className="rounded-sm border border-border bg-muted/30 px-2 py-1 text-xs text-muted-foreground">
                Preview skipped
              </span>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              <span className="font-mono text-foreground">{fileName}</span>
              {" "}
              is available for download. Inline preview is disabled for files larger than
              {" "}
              {PREVIEW_LIMIT_LABEL}
              .
            </p>
          </div>
        </div>

        <dl className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
          <div className="rounded-md border border-border bg-muted/20 px-3 py-2">
            <dt className="mb-1 font-medium text-foreground">Size</dt>
            <dd className="font-mono">{fileSize}</dd>
          </div>
          <div className="rounded-md border border-border bg-muted/20 px-3 py-2">
            <dt className="mb-1 font-medium text-foreground">Type</dt>
            <dd className="truncate font-mono" title={contentType || "Unknown"}>
              {contentType || "Unknown"}
            </dd>
          </div>
        </dl>

        <div className="flex justify-center sm:justify-start">
          <Button
            nativeButton={false}
            render={(
              <a href={downloadUrl} download={fileName}>
                <Download className="size-4" />
                Download File
              </a>
            )}
          />
        </div>
      </div>
    </div>
  );
}

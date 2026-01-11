import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";

export interface LargeFileWarningProps {
  fileName: string;
  size: number;
  downloadUrl: string;
  contentType: string;
}

/**
 * Warning component shown for files too large to render inline
 * Displays file metadata and provides a download button
 */
export function LargeFileWarning({ fileName, size, downloadUrl, contentType }: LargeFileWarningProps) {
  const sizeInMB = (size / (1024 * 1024)).toFixed(2);

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-yellow-200 bg-yellow-50 p-8 dark:border-yellow-800 dark:bg-yellow-950">
      <div className="rounded-full bg-yellow-100 p-3 dark:bg-yellow-900">
        <Download className="size-6 text-yellow-600 dark:text-yellow-400" />
      </div>

      <div className="text-center">
        <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100">
          File Too Large to Preview
        </h3>
        <p className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
          <span className="font-mono">{fileName}</span>
          {" "}
          is
          {" "}
          {sizeInMB}
          {" "}
          MB
        </p>
        <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">
          Files larger than 1 MB cannot be previewed to prevent performance issues
        </p>
      </div>

      <div className="flex flex-col gap-2 text-xs text-yellow-700 dark:text-yellow-300">
        <div className="flex gap-2">
          <span className="font-semibold">Size:</span>
          <span className="font-mono">
            {sizeInMB}
            {" "}
            MB
          </span>
        </div>
        <div className="flex gap-2">
          <span className="font-semibold">Type:</span>
          <span className="font-mono">{contentType}</span>
        </div>
      </div>

      <Button
        variant="default"
        nativeButton={false}
        render={(
          <a href={downloadUrl} download={fileName}>
            <Download className="mr-2 size-4" />
            Download File
          </a>
        )}
      />
    </div>
  );
}

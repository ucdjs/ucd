import { Download, FileWarning } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface NonRenderableFileProps {
  fileName: string;
  filePath: string;
  contentType: string;
}

/**
 * File extensions that cannot be rendered as text
 */
// eslint-disable-next-line react-refresh/only-export-components
export const NON_RENDERABLE_EXTENSIONS = new Set([
  // Archives
  "zip",
  "tar",
  "gz",
  "bz2",
  "7z",
  "rar",
  "xz",
  // Images
  "png",
  "jpg",
  "jpeg",
  "gif",
  "bmp",
  "ico",
  "webp",
  "svg",
  "tiff",
  "tif",
  // Documents
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  // Binaries
  "exe",
  "dll",
  "so",
  "dylib",
  "bin",
  "dat",
  // Fonts
  "ttf",
  "otf",
  "woff",
  "woff2",
  "eot",
  // Media
  "mp3",
  "mp4",
  "wav",
  "avi",
  "mov",
  "mkv",
  "webm",
  "ogg",
]);

/**
 * Get a human-readable file type description
 */
function getFileTypeDescription(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";

  const descriptions: Record<string, string> = {
    // Archives
    "zip": "ZIP Archive",
    "tar": "TAR Archive",
    "gz": "GZIP Archive",
    "bz2": "BZIP2 Archive",
    "7z": "7-Zip Archive",
    "rar": "RAR Archive",
    "xz": "XZ Archive",
    // Images
    "png": "PNG Image",
    "jpg": "JPEG Image",
    "jpeg": "JPEG Image",
    "gif": "GIF Image",
    "bmp": "Bitmap Image",
    "ico": "Icon File",
    "webp": "WebP Image",
    "svg": "SVG Image",
    "tiff": "TIFF Image",
    "tif": "TIFF Image",
    // Documents
    "pdf": "PDF Document",
    "doc": "Word Document",
    "docx": "Word Document",
    "xls": "Excel Spreadsheet",
    "xlsx": "Excel Spreadsheet",
    "ppt": "PowerPoint Presentation",
    "pptx": "PowerPoint Presentation",
    // Binaries
    "exe": "Windows Executable",
    "dll": "Dynamic Link Library",
    "so": "Shared Object",
    "dylib": "Dynamic Library",
    "bin": "Binary File",
    "dat": "Data File",
    // Fonts
    "ttf": "TrueType Font",
    "otf": "OpenType Font",
    "woff": "Web Font",
    "woff2": "Web Font 2",
    "eot": "Embedded OpenType Font",
    // Media
    "mp3": "MP3 Audio",
    "mp4": "MP4 Video",
    "wav": "WAV Audio",
    "avi": "AVI Video",
    "mov": "QuickTime Video",
    "mkv": "Matroska Video",
    "webm": "WebM Video",
    "ogg": "Ogg Media",
  };

  return descriptions[ext] || "Binary File";
}

export function NonRenderableFile({ fileName, filePath, contentType }: NonRenderableFileProps) {
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
          <div className="rounded-full bg-muted p-6">
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
            nativeButton={false}
            render={(
              <a
                href={`https://api.ucdjs.dev/api/v1/files/${filePath}`}
                download={fileName}
              >
                <Download className="size-4" />
                Download File
              </a>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}

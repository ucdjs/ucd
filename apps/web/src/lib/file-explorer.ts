import z from "zod";

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

export function getFileTypeDescription(fileName: string): string {
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

export const searchSchema = z.object({
  query: z.string().optional(),
  viewMode: z.enum(["list", "cards"]).optional(),
  pattern: z.string().optional(),
  sort: z.enum(["name", "lastModified"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
  type: z.enum(["all", "files", "directories"]).optional(),
});

export type SearchQueryParams = z.output<typeof searchSchema>;

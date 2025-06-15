// ONLY STOW TYPES IN HERE WHEN THEY CAN'T BE COLOCATED WITH THE CODE THAT USES THEM

export interface FSAdapter {
  readFile: (path: string) => Promise<string>;
  writeFile: (path: string, data: string, encoding?: BufferEncoding) => Promise<void>;
  mkdir: (path: string, options?: { recursive?: boolean; mode?: number }) => Promise<void>;
  readdir: (path: string) => Promise<string[]>;
  stat: (path: string) => Promise<{ isFile: () => boolean; isDirectory: () => boolean; mtime: Date; size: number }>;
  unlink: (path: string) => Promise<void>;
  access: (path: string, mode?: number) => Promise<void>;
  rm: (path: string, options?: { recursive?: boolean; force?: boolean }) => Promise<void>;
}

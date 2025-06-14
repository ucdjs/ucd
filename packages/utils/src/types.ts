// ONLY STOW TYPES IN HERE WHEN THEY CAN'T BE COLOCATED WITH THE CODE THAT USES THEM

import type { MakeDirectoryOptions, Mode } from "node:fs";

export interface FSAdapter {
  readFile: (path: string) => Promise<string>;
  mkdir: (path: string, options?: Mode | MakeDirectoryOptions | null) => Promise<string | undefined>;
  ensureDir: (path: string) => Promise<void>;
  writeFile: (path: string, data: string) => Promise<void>;
  exists: (path: string) => Promise<boolean>;
  readdir: (path: string, recursive?: boolean) => Promise<string[]>;
}

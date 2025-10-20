import type { FSEntry } from "@ucdjs/fs-bridge";
import type Dirent from "memfs/lib/node/Dirent";
import { dirname, join, relative } from "node:path";
import { trimTrailingSlash } from "@luxass/utils";
import { defineFileSystemBridge } from "@ucdjs/fs-bridge";
import { memfs } from "memfs";

export const createReadOnlyMockFS = defineFileSystemBridge({
  meta: {
    name: "Read-Only Mock File System Bridge",
    description: "A read-only mock file system bridge that simulates a file system with no files.",
  },
  setup() {
    return {
      async read() {
        return JSON.stringify({});
      },
      async exists() {
        return true;
      },
      async listdir() {
        return [];
      },
    };
  },
});

export function stripChildrenFromEntries<TObj extends { children?: unknown[] }>(entries: TObj[]): Omit<TObj, "children">[] {
  return entries.map((entry) => {
    const { children: _children, ...rest } = entry;
    return rest;
  });
}

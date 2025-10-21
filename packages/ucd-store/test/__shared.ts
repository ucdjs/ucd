import { defineFileSystemBridge } from "@ucdjs/fs-bridge";

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

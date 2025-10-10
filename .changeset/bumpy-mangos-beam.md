---
"@ucdjs-internal/shared": minor
---

## New filterTreeStructure Function

Added a new utility function for filtering tree structures using PathFilter:

```ts
export function filterTreeStructure(
  pathFilter: PathFilter,
  entries: TreeEntry[],
  extraOptions?: Pick<PathFilterOptions, "include" | "exclude">
): TreeEntry[]
```

### Features
- **Recursive filtering**: Processes nested directory structures
- **Path construction**: Builds full paths from relative entry paths
- **Smart directory inclusion**: Includes directories if they contain matching files, even if the directory itself doesn't match
- **Structure preservation**: Maintains tree hierarchy while filtering contents

### TreeEntry Type
```ts
type TreeEntry = {
  type: "file";
  name: string;
  path: string;
} | {
  type: "directory";
  name: string;
  path: string;
  children: TreeEntry[];
};
```

### Example Usage
```ts
const filter = createPathFilter({
  include: ['**/*.ts'],
  exclude: ['**/*.test.ts']
});

const tree = [
  {
    type: "directory",
    name: "src",
    path: "src",
    children: [
      { type: "file", name: "index.ts", path: "index.ts" },
      { type: "file", name: "index.test.ts", path: "index.test.ts" }
    ]
  }
];

const filtered = filterTreeStructure(filter, tree);
// Result: src directory with only index.ts (test file excluded)
```

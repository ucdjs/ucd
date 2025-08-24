import { describe, expect, it } from "vitest";
import { UnicodeTreeNodeSchema, UnicodeTreeSchema } from "../src/tree";

describe("UnicodeTreeNodeSchema", () => {
  it("should validate a file node", () => {
    const fileNode = {
      type: "file",
      name: "UnicodeData.txt",
      path: "/15.1.0/ucd/UnicodeData.txt",
      lastModified: Date.now(),
    };
    const result = UnicodeTreeNodeSchema.safeParse(fileNode);
    expect(result.success).toBe(true);
  });

  it("should validate a directory node with children", () => {
    const directoryNode = {
      type: "directory",
      name: "ucd",
      path: "/15.1.0/ucd",
      lastModified: Date.now(),
      children: [
        {
          type: "file",
          name: "UnicodeData.txt",
          path: "/15.1.0/ucd/UnicodeData.txt",
          lastModified: Date.now(),
        },
      ],
    };
    const result = UnicodeTreeNodeSchema.safeParse(directoryNode);
    expect(result.success).toBe(true);
  });

  it("should validate nested directory structure", () => {
    const nestedStructure = {
      type: "directory",
      name: "15.1.0",
      path: "/15.1.0",
      children: [
        {
          type: "directory",
          name: "ucd",
          path: "/15.1.0/ucd",
          children: [
            {
              type: "file",
              name: "UnicodeData.txt",
              path: "/15.1.0/ucd/UnicodeData.txt",
              lastModified: Date.now(),
            },
          ],
        },
      ],
    };
    const result = UnicodeTreeNodeSchema.safeParse(nestedStructure);
    expect(result.success).toBe(true);
  });

  it("should invalidate a node with invalid type", () => {
    const invalidNode = {
      type: "invalid",
      name: "test",
      path: "/test",
    };
    const result = UnicodeTreeNodeSchema.safeParse(invalidNode);
    expect(result.success).toBe(false);
  });

  it("should invalidate a directory without children", () => {
    const directoryWithoutChildren = {
      type: "directory",
      name: "ucd",
      path: "/15.1.0/ucd",
    };
    const result = UnicodeTreeNodeSchema.safeParse(directoryWithoutChildren);
    expect(result.success).toBe(false);
  });
});

describe("UnicodeTreeSchema", () => {
  it("should validate a tree with multiple root nodes", () => {
    const tree = [
      {
        type: "directory",
        name: "15.1.0",
        path: "/15.1.0",
        children: [
          {
            type: "file",
            name: "README.txt",
            path: "/15.1.0/README.txt",
          },
        ],
      },
      {
        type: "directory",
        name: "15.0.0",
        path: "/15.0.0",
        children: [],
      },
    ];
    const result = UnicodeTreeSchema.safeParse(tree);
    expect(result.success).toBe(true);
  });

  it("should validate an empty tree", () => {
    const emptyTree: any[] = [];
    const result = UnicodeTreeSchema.safeParse(emptyTree);
    expect(result.success).toBe(true);
  });
});
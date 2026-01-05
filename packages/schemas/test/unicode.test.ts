/// <reference types="../../test-utils/src/matchers/types.d.ts" />
import { describe, expect, it } from "vitest";
import {
  UnicodeFileTreeNodeSchema,
  UnicodeFileTreeSchema,
  UnicodeVersionDetailsSchema,
  UnicodeVersionListSchema,
  UnicodeVersionSchema,
} from "../src/unicode";

// eslint-disable-next-line test/prefer-lowercase-title
describe("UnicodeVersionSchema", () => {
  it("should validate a stable version", () => {
    const validVersion = {
      version: "16.0.0",
      documentationUrl: "https://www.unicode.org/versions/Unicode16.0.0/",
      date: "2024",
      url: "https://www.unicode.org/Public/16.0.0",
      mappedUcdVersion: null,
      type: "stable",
    };
    expect(validVersion).toMatchSchema({
      schema: UnicodeVersionSchema,
      success: true,
      data: {
        version: "16.0.0",
        type: "stable",
      },
    });
  });

  it("should validate a draft version", () => {
    const draftVersion = {
      version: "17.0.0",
      documentationUrl: "https://www.unicode.org/versions/Unicode17.0.0/",
      date: null,
      url: "https://www.unicode.org/Public/17.0.0",
      mappedUcdVersion: null,
      type: "draft",
    };
    expect(draftVersion).toMatchSchema({
      schema: UnicodeVersionSchema,
      success: true,
      data: {
        type: "draft",
        date: null,
      },
    });
  });

  it("should validate an unsupported version", () => {
    const unsupportedVersion = {
      version: "1.0.0",
      documentationUrl: "https://www.unicode.org/versions/Unicode1.0.0/",
      date: "1991",
      url: "https://www.unicode.org/Public/1.0.0",
      mappedUcdVersion: null,
      type: "unsupported",
    };
    expect(unsupportedVersion).toMatchSchema({
      schema: UnicodeVersionSchema,
      success: true,
      data: {
        type: "unsupported",
      },
    });
  });

  it("should validate version with mapped UCD version", () => {
    const versionWithMapping = {
      version: "2.0.0",
      documentationUrl: "https://www.unicode.org/versions/Unicode2.0.0/",
      date: "1996",
      url: "https://www.unicode.org/Public/2.0.0",
      mappedUcdVersion: "2.0.14",
      type: "stable",
    };
    expect(versionWithMapping).toMatchSchema({
      schema: UnicodeVersionSchema,
      success: true,
      data: {
        mappedUcdVersion: "2.0.14",
      },
    });
  });

  it("should reject invalid date format", () => {
    const invalidVersion = {
      version: "16.0.0",
      documentationUrl: "https://www.unicode.org/versions/Unicode16.0.0/",
      date: "24", // should be 4 digits
      url: "https://www.unicode.org/Public/16.0.0",
      mappedUcdVersion: null,
      type: "stable",
    };
    expect(invalidVersion).toMatchSchema({
      schema: UnicodeVersionSchema,
      success: false,
    });
  });

  it("should reject invalid URL", () => {
    const invalidVersion = {
      version: "16.0.0",
      documentationUrl: "not-a-url",
      date: "2024",
      url: "https://www.unicode.org/Public/16.0.0",
      mappedUcdVersion: null,
      type: "stable",
    };
    expect(invalidVersion).toMatchSchema({
      schema: UnicodeVersionSchema,
      success: false,
    });
  });

  it("should reject invalid type", () => {
    const invalidVersion = {
      version: "16.0.0",
      documentationUrl: "https://www.unicode.org/versions/Unicode16.0.0/",
      date: "2024",
      url: "https://www.unicode.org/Public/16.0.0",
      mappedUcdVersion: null,
      type: "beta", // invalid type
    };
    expect(invalidVersion).toMatchSchema({
      schema: UnicodeVersionSchema,
      success: false,
    });
  });
});

// eslint-disable-next-line test/prefer-lowercase-title
describe("UnicodeVersionListSchema", () => {
  it("should validate a list of versions", () => {
    const validList = [
      {
        version: "16.0.0",
        documentationUrl: "https://www.unicode.org/versions/Unicode16.0.0/",
        date: "2024",
        url: "https://www.unicode.org/Public/16.0.0",
        mappedUcdVersion: null,
        type: "stable",
      },
      {
        version: "15.1.0",
        documentationUrl: "https://www.unicode.org/versions/Unicode15.1.0/",
        date: "2023",
        url: "https://www.unicode.org/Public/15.1.0",
        mappedUcdVersion: null,
        type: "stable",
      },
    ];
    expect(validList).toMatchSchema({
      schema: UnicodeVersionListSchema,
      success: true,
    });
  });

  it("should validate an empty list", () => {
    expect([]).toMatchSchema({
      schema: UnicodeVersionListSchema,
      success: true,
    });
  });
});

// eslint-disable-next-line test/prefer-lowercase-title
describe("UnicodeFileTreeNodeSchema", () => {
  it("should validate a file node", () => {
    const fileNode = {
      type: "file",
      name: "UnicodeData.txt",
      path: "/16.0.0/UnicodeData.txt",
      lastModified: 1704067200000,
    };
    expect(fileNode).toMatchSchema({
      schema: UnicodeFileTreeNodeSchema,
      success: true,
      data: {
        type: "file",
        name: "UnicodeData.txt",
      },
    });
  });

  it("should validate a file node without lastModified", () => {
    const fileNode = {
      type: "file",
      name: "UnicodeData.txt",
      path: "/16.0.0/UnicodeData.txt",
    };

    expect(fileNode).toMatchSchema({
      schema: UnicodeFileTreeNodeSchema,
      success: false,
    });
  });

  it("should validate a directory node", () => {
    const directoryNode = {
      type: "directory",
      name: "extracted",
      path: "/16.0.0/extracted/",
      lastModified: 1704067200000,
      children: [
        {
          type: "file",
          name: "UnicodeData.txt",
          path: "/16.0.0/extracted/UnicodeData.txt",
          lastModified: 1704067200000,
        },
      ],
    };
    expect(directoryNode).toMatchSchema({
      schema: UnicodeFileTreeNodeSchema,
      success: true,
      data: {
        type: "directory",
      },
    });
  });

  it("should validate nested directory structure", () => {
    const nestedStructure = {
      type: "directory",
      name: "root",
      path: "/root/",
      lastModified: null,
      children: [
        {
          type: "directory",
          name: "level1",
          path: "/root/level1/",
          lastModified: null,
          children: [
            {
              type: "directory",
              name: "level2",
              path: "/root/level1/level2/",
              lastModified: null,
              children: [
                {
                  type: "file",
                  name: "deep.txt",
                  path: "/root/level1/level2/deep.txt",
                  lastModified: null,
                },
              ],
            },
          ],
        },
      ],
    };
    expect(nestedStructure).toMatchSchema({
      schema: UnicodeFileTreeNodeSchema,
      success: true,
    });
  });

  it("should validate directory with empty children", () => {
    const emptyDirectory = {
      type: "directory",
      name: "empty",
      path: "/empty/",
      children: [],
      lastModified: null,
    };
    expect(emptyDirectory).toMatchSchema({
      schema: UnicodeFileTreeNodeSchema,
      success: true,
    });
  });

  it("should reject file node with children", () => {
    const invalidFile = {
      type: "file",
      name: "file.txt",
      path: "/file.txt",
      children: [], // files shouldn't have children
    };
    expect(invalidFile).toMatchSchema({
      schema: UnicodeFileTreeNodeSchema,
      success: false,
    });
  });

  it("should reject directory without children", () => {
    const invalidDirectory = {
      type: "directory",
      name: "folder",
      path: "/folder",
      // missing children
    };
    expect(invalidDirectory).toMatchSchema({
      schema: UnicodeFileTreeNodeSchema,
      success: false,
    });
  });
});

// eslint-disable-next-line test/prefer-lowercase-title
describe("UnicodeFileTreeSchema", () => {
  it("should validate a tree structure", () => {
    const validTree = [
      {
        type: "file",
        name: "README.txt",
        path: "/README.txt",
        lastModified: null,
      },
      {
        type: "directory",
        name: "docs",
        path: "/docs/",
        lastModified: 1704067200000,
        children: [
          {
            type: "file",
            name: "index.html",
            path: "/docs/index.html",
            lastModified: 1704067200000,
          },
        ],
      },
    ];

    expect(validTree).toMatchSchema({
      schema: UnicodeFileTreeSchema,
      success: true,
    });
  });

  it("should validate an empty tree", () => {
    expect([]).toMatchSchema({
      schema: UnicodeFileTreeSchema,
      success: true,
    });
  });
});

// eslint-disable-next-line test/prefer-lowercase-title
describe("UnicodeVersionDetailsSchema", () => {
  it("should validate version details with statistics", () => {
    const validDetails = {
      version: "16.0.0",
      documentationUrl: "https://www.unicode.org/versions/Unicode16.0.0/",
      date: "2024",
      url: "https://www.unicode.org/Public/16.0.0",
      mappedUcdVersion: null,
      type: "stable",
      statistics: {
        totalCharacters: 149813,
        newCharacters: 5185,
        totalBlocks: 337,
        newBlocks: 8,
        totalScripts: 161,
        newScripts: 4,
      },
    };
    expect(validDetails).toMatchSchema({
      schema: UnicodeVersionDetailsSchema,
      success: true,
      data: {
        version: "16.0.0",
      },
    });
  });

  it("should use default statistics when not provided", () => {
    const detailsWithoutStats = {
      version: "16.0.0",
      documentationUrl: "https://www.unicode.org/versions/Unicode16.0.0/",
      date: "2024",
      url: "https://www.unicode.org/Public/16.0.0",
      mappedUcdVersion: null,
      type: "stable",
    };
    expect(detailsWithoutStats).toMatchSchema({
      schema: UnicodeVersionDetailsSchema,
      success: true,
    });
  });

  it("should reject negative statistics", () => {
    const invalidDetails = {
      version: "16.0.0",
      documentationUrl: "https://www.unicode.org/versions/Unicode16.0.0/",
      date: "2024",
      url: "https://www.unicode.org/Public/16.0.0",
      mappedUcdVersion: null,
      type: "stable",
      statistics: {
        totalCharacters: -100,
        newCharacters: 5185,
        totalBlocks: 337,
        newBlocks: 8,
        totalScripts: 161,
        newScripts: 4,
      },
    };
    expect(invalidDetails).toMatchSchema({
      schema: UnicodeVersionDetailsSchema,
      success: false,
    });
  });
});

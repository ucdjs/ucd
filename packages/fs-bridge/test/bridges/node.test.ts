import { flattenFilePaths } from "@ucdjs/utils";
import { describe, expect, it } from "vitest";
import { testdir } from "vitest-testdirs";
import NodeFileSystemBridge from "../../src/bridges/node";

describe("node fs-bridge", () => {
  describe("read operation", () => {
    it("should read existing file", async () => {
      const testDir = await testdir({ "test-file.txt": "file content" });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      const content = await bridge.read("test-file.txt");
      expect(content).toBe("file content");
    });

    it("should read nested file", async () => {
      const testDir = await testdir({
        nested: { "file.txt": "nested content" },
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      const content = await bridge.read("nested/file.txt");
      expect(content).toBe("nested content");
    });

    it("should throw error for non-existent file", async () => {
      const testDir = await testdir({});
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      await expect(bridge.read("non-existent.txt")).rejects.toThrow();
    });
  });

  describe("write operation", () => {
    it("should write new file", async () => {
      const testDir = await testdir({});
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      await bridge.write("new-file.txt", "new content");
      const content = await bridge.read("new-file.txt");
      expect(content).toBe("new content");
    });

    it("should overwrite existing file", async () => {
      const testDir = await testdir({ "existing.txt": "old content" });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      await bridge.write("existing.txt", "updated content");
      const content = await bridge.read("existing.txt");
      expect(content).toBe("updated content");
    });

    it("should write with different encoding", async () => {
      const testDir = await testdir({});
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      await bridge.write("encoded.txt", "encoded content", "utf8");
      const content = await bridge.read("encoded.txt");
      expect(content).toBe("encoded content");
    });

    it("should create parent directories when writing to nested path", async () => {
      const testDir = await testdir({});
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      await bridge.write("deep/nested/path/file.txt", "auto-created content");
      const content = await bridge.read("deep/nested/path/file.txt");
      expect(content).toBe("auto-created content");

      // verify parent directories were created
      expect(await bridge.exists("deep")).toBe(true);
      expect(await bridge.exists("deep/nested")).toBe(true);
      expect(await bridge.exists("deep/nested/path")).toBe(true);
    });
  });

  describe("exists operation", () => {
    it("should return true for existing file", async () => {
      const testDir = await testdir({ "exists.txt": "content" });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      const exists = await bridge.exists("exists.txt");
      expect(exists).toBe(true);
    });

    it("should return true for existing directory", async () => {
      const testDir = await testdir({ dir: {} });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      const exists = await bridge.exists("dir");
      expect(exists).toBe(true);
    });

    it("should return false for non-existent file", async () => {
      const testDir = await testdir({});
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      const exists = await bridge.exists("missing.txt");
      expect(exists).toBe(false);
    });
  });

  describe("listdir operation", () => {
    it("should list files in directory", async () => {
      const testDir = await testdir({
        "file1.txt": "content1",
        "file2.txt": "content2",
        "subdir": {},
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      const files = await bridge.listdir("");
      expect(files).toHaveLength(3);
      expect(files).toEqual([
        { type: "file", name: "file1.txt", path: "/file1.txt" },
        { type: "file", name: "file2.txt", path: "/file2.txt" },
        { type: "directory", name: "subdir", path: "/subdir", children: [] },
      ]);
    });

    it("should list files recursively", async () => {
      const testDir = await testdir({
        "root.txt": "root",
        "dir": {
          "nested.txt": "nested",
          "deep": {
            "file.txt": "deep",
          },
        },
      });

      const bridge = NodeFileSystemBridge({ basePath: testDir });

      const files = await bridge.listdir("", true);
      expect(files).toHaveLength(2);

      const flattened = flattenFilePaths(files);

      expect(flattened).toHaveLength(3);
      expect(flattened).toEqual([
        "/dir/deep/file.txt",
        "/dir/nested.txt",
        "/root.txt",
      ]);
      expect(files.map((f) => f.name)).toContain("root.txt");
    });

    it("should return empty array for empty directory", async () => {
      const testDir = await testdir({ empty: {} });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      const files = await bridge.listdir("empty");
      expect(files).toEqual([]);
    });
  });

  describe("mkdir operation", () => {
    it("should create new directory", async () => {
      const testDir = await testdir({});
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      await bridge.mkdir("new-dir");
      const exists = await bridge.exists("new-dir");
      expect(exists).toBe(true);
    });

    it("should create nested directories", async () => {
      const testDir = await testdir({});
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      await bridge.mkdir("deep/nested/dirs");
      const exists = await bridge.exists("deep/nested/dirs");
      expect(exists).toBe(true);
    });

    it("should not throw if directory exists", async () => {
      const testDir = await testdir({ existing: {} });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      await expect(bridge.mkdir("existing")).resolves.not.toThrow();
    });
  });

  describe("rm operation", () => {
    it("should remove file", async () => {
      const testDir = await testdir({ "remove-me.txt": "content" });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      await bridge.rm("remove-me.txt");
      const exists = await bridge.exists("remove-me.txt");
      expect(exists).toBe(false);
    });

    it("should remove directory recursively", async () => {
      const testDir = await testdir({
        "remove-dir": {
          "file.txt": "content",
          "subdir": { "nested.txt": "nested" },
        },
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      await bridge.rm("remove-dir", { recursive: true });
      const exists = await bridge.exists("remove-dir");
      expect(exists).toBe(false);
    });

    it("should not throw with force option for non-existent", async () => {
      const testDir = await testdir({});
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      await expect(bridge.rm("missing.txt", { force: true })).resolves.not.toThrow();
    });

    it("should throw without force for non-existent", async () => {
      const testDir = await testdir({});
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      await expect(bridge.rm("missing.txt")).rejects.toThrow();
    });
  });

  describe("complex workflows", () => {
    it("should manage a project workspace", async () => {
      const testDir = await testdir({});
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      // create project structure
      await bridge.mkdir("src");
      await bridge.mkdir("tests");
      await bridge.mkdir("docs");

      // write project files
      await bridge.write("package.json", "{\"name\": \"test-project\", \"version\": \"1.0.0\"}");
      await bridge.write("README.md", "# Test Project\n\nA sample project");
      await bridge.write("src/index.js", "console.log('Hello World');");
      await bridge.write("tests/index.test.js", "test('should work', () => {});");

      // verify project structure
      const rootFiles = await bridge.listdir(".");
      expect(rootFiles).toHaveLength(5);
      expect(rootFiles).toEqual([
        { type: "file", name: "README.md", path: "/README.md" },
        { type: "directory", name: "docs", path: "/docs", children: [] },
        { type: "file", name: "package.json", path: "/package.json" },
        { type: "directory", name: "src", path: "/src", children: [] },
        { type: "directory", name: "tests", path: "/tests", children: [] },
      ]);

      // verify file contents
      const packageJson = await bridge.read("package.json");
      expect(JSON.parse(packageJson).name).toBe("test-project");

      // update README
      const currentReadme = await bridge.read("README.md");
      await bridge.write("README.md", `${currentReadme}\n\n## Installation\n\nnpm install`);

      const updatedReadme = await bridge.read("README.md");
      expect(updatedReadme).toContain("## Installation");

      // clean up build artifacts
      await bridge.write("dist/bundle.js", "// built file");
      await bridge.rm("dist", { recursive: true, force: true });
      expect(await bridge.exists("dist")).toBe(false);
    });

    it("should handle blog content management", async () => {
      const testDir = await testdir({});
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      // create blog structure
      await bridge.mkdir("posts/2024");
      await bridge.mkdir("drafts");
      await bridge.mkdir("assets/images");

      // write blog posts
      await bridge.write("posts/2024/first-post.md", "# My First Post\n\nHello world!");
      await bridge.write("posts/2024/second-post.md", "# Another Post\n\nMore content here.");
      await bridge.write("drafts/upcoming.md", "# Draft Post\n\nWork in progress...");

      // list all published posts
      const posts = await bridge.listdir("posts", true);

      const flattenedPosts = flattenFilePaths(posts);
      expect(flattenedPosts).toHaveLength(2);
      expect(flattenedPosts).toContain("/2024/first-post.md");
      expect(flattenedPosts).toContain("/2024/second-post.md");

      // move draft to published
      const draftContent = await bridge.read("drafts/upcoming.md");
      await bridge.write("posts/2024/upcoming.md", draftContent);
      await bridge.rm("drafts/upcoming.md");

      // verify the move
      expect(await bridge.exists("posts/2024/upcoming.md")).toBe(true);
      expect(await bridge.exists("drafts/upcoming.md")).toBe(false);

      // archive old posts
      await bridge.mkdir("archive/2024");
      const oldPost = await bridge.read("posts/2024/first-post.md");
      await bridge.write("archive/2024/first-post.md", oldPost);
      await bridge.rm("posts/2024/first-post.md");

      expect(await bridge.exists("archive/2024/first-post.md")).toBe(true);
      expect(await bridge.exists("posts/2024/first-post.md")).toBe(false);
    });

    it("should process multiple files concurrently", async () => {
      const testDir = await testdir({});
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      // create multiple log files concurrently
      const logEntries = Array.from({ length: 10 }, (_, i) => ({
        filename: `log-${i + 1}.txt`,
        content: `Log entry ${i + 1}: ${new Date().toISOString()}`,
      }));

      await Promise.all(
        logEntries.map(({ filename, content }) =>
          bridge.write(filename, content),
        ),
      );

      // read all logs concurrently
      const logContents = await Promise.all(
        logEntries.map(({ filename }) => bridge.read(filename)),
      );

      // verify all logs were created correctly
      logContents.forEach((content, index) => {
        expect(content).toContain(`Log entry ${index + 1}`);
      });

      // process logs (simulate aggregation)
      const summary = logContents.map((content) => content.split("\n")[0]).join("\n");
      await bridge.write("summary.txt", summary);

      const summaryContent = await bridge.read("summary.txt");
      expect(summaryContent).toContain("Log entry 1");
      expect(summaryContent).toContain("Log entry 10");
    });
  });
});

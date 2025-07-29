import { flattenFilePaths } from "@ucdjs/utils";
import { describe, expect, it } from "vitest";
import { testdir } from "vitest-testdirs";
import NodeFileSystemBridge from "../../src/bridges/node";

describe("node fs-bridge", () => {
  describe("initialization and schema validation", () => {
    it.each([
      "/",
      "/usr",
      "/bin",
      "/sbin",
      "/etc",
      "/var",
      "/sys",
      "/proc",
    ])("should not allow dangerous basePath: %s", async (dangerousBasePath) => {
      expect(() => NodeFileSystemBridge({ basePath: dangerousBasePath })).toThrow(/Base path cannot resolve to a dangerous system path/);
    });

    it.each([
      "/usr/", // trailing slash
      "/usr/../usr", // self-referencing
      "//usr", // double slash
      "/usr/./", // current directory reference
      "/usr/../bin", // parent directory reference
      "/usr/../../etc", // multiple parent references
    ])("should not allow dangerous basePath with normalization edge cases: %s", async (dangerousBasePath) => {
      expect(() => NodeFileSystemBridge({ basePath: dangerousBasePath })).toThrow(/Base path cannot resolve to a dangerous system path/);
    });

    it("should allow safe basePath values that contain dangerous names", async () => {
      const testDir = await testdir({});

      const safePaths = [
        `${testDir}/usr`, // usr folder within test directory
        `${testDir}/etc/config`, // etc folder within test directory
        `${testDir}/my-bin-folder`, // folder with 'bin' in name
      ];

      for (const basePath of safePaths) {
        expect(() => NodeFileSystemBridge({ basePath })).not.toThrow();
      }
    });
  });

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

  describe("absolute path handling", () => {
    it("should handle absolute paths for read operation", async () => {
      const testDir = await testdir({ "absolute-test.txt": "absolute content" });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      const content = await bridge.read("/absolute-test.txt");
      expect(content).toBe("absolute content");
    });

    it("should handle absolute paths for write operation", async () => {
      const testDir = await testdir({});
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      await bridge.write("/absolute-write.txt", "absolute write content");
      const content = await bridge.read("/absolute-write.txt");
      expect(content).toBe("absolute write content");
    });

    it("should handle absolute paths for exists operation", async () => {
      const testDir = await testdir({ "absolute-exists.txt": "exists" });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      const exists = await bridge.exists("/absolute-exists.txt");
      expect(exists).toBe(true);

      const notExists = await bridge.exists("/absolute-missing.txt");
      expect(notExists).toBe(false);
    });

    it("should handle absolute paths for mkdir operation", async () => {
      const testDir = await testdir({});
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      await bridge.mkdir("/absolute-dir");
      const exists = await bridge.exists("/absolute-dir");
      expect(exists).toBe(true);
    });

    it("should handle absolute paths for nested directories", async () => {
      const testDir = await testdir({});
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      await bridge.mkdir("/absolute/nested/deep");
      expect(await bridge.exists("/absolute")).toBe(true);
      expect(await bridge.exists("/absolute/nested")).toBe(true);
      expect(await bridge.exists("/absolute/nested/deep")).toBe(true);
    });

    it("should handle absolute paths for listdir operation", async () => {
      const testDir = await testdir({
        "root-file.txt": "root",
        "absolute-dir": {
          "nested.txt": "nested content",
        },
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      const files = await bridge.listdir("/absolute-dir");
      expect(files).toHaveLength(1);
      expect(files[0]).toEqual({
        type: "file",
        name: "nested.txt",
        path: "/nested.txt",
      });
    });

    it("should handle absolute paths for rm operation", async () => {
      const testDir = await testdir({
        "absolute-remove.txt": "remove me",
        "absolute-dir": {
          "nested.txt": "nested",
        },
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      await bridge.rm("/absolute-remove.txt");
      expect(await bridge.exists("/absolute-remove.txt")).toBe(false);

      await bridge.rm("/absolute-dir", { recursive: true });
      expect(await bridge.exists("/absolute-dir")).toBe(false);
    });

    it("should write to absolute nested paths and create parent directories", async () => {
      const testDir = await testdir({});
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      await bridge.write("/absolute/deep/nested/file.txt", "deep absolute content");
      const content = await bridge.read("/absolute/deep/nested/file.txt");
      expect(content).toBe("deep absolute content");

      // verify parent directories were created
      expect(await bridge.exists("/absolute")).toBe(true);
      expect(await bridge.exists("/absolute/deep")).toBe(true);
      expect(await bridge.exists("/absolute/deep/nested")).toBe(true);
    });

    it("should handle mixed absolute and relative paths in workflow", async () => {
      const testDir = await testdir({});
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      // Create using absolute path
      await bridge.write("/absolute-config.json", '{"version": "1.0.0"}');
      
      // Create using relative path  
      await bridge.write("relative-readme.md", "# Project");
      
      // Read using absolute path
      const config = await bridge.read("/absolute-config.json");
      expect(JSON.parse(config).version).toBe("1.0.0");
      
      // Read using relative path
      const readme = await bridge.read("relative-readme.md");
      expect(readme).toBe("# Project");
      
      // Verify both exist using different path styles
      expect(await bridge.exists("/absolute-config.json")).toBe(true);
      expect(await bridge.exists("relative-readme.md")).toBe(true);
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

  it("should handle absolute paths that include basePath", async () => {
    const testDir = await testdir({ "file.json": JSON.stringify({ test: true }) });
    const bridge = NodeFileSystemBridge({ basePath: testDir });

    // should work when absolute path includes the basePath
    const absolutePathWithinBase = `${testDir}/file.json`;

    const absoluteExists = await bridge.exists(absolutePathWithinBase);
    const absoluteRead = await bridge.read(absolutePathWithinBase);

    const relativeExists = await bridge.exists("file.json");
    const relativeRead = await bridge.read("file.json");

    expect(absoluteExists).toBe(true);
    expect(relativeExists).toBe(true);
    expect(absoluteRead).toBe("{\"test\":true}");
    expect(relativeRead).toBe("{\"test\":true}");

    // should work for writing to absolute paths within basePath
    const absoluteNestedPath = `${testDir}/nested/file.txt`;

    await expect(bridge.write(absoluteNestedPath, "nested content")).resolves.not.toThrow();
    await expect(bridge.read(absoluteNestedPath)).resolves.toBe("nested content");

    // should still block absolute paths outside basePath
    await expect(bridge.exists("/outside/basepath/file.txt")).rejects.toThrow(/Path traversal detected/);
  });

  describe("security tests", () => {
    it("should prevent path traversal attacks", async () => {
      const testDir = await testdir({
        "secret.txt": "confidential",
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      // test various path traversal attempts
      const traversalPaths = [
        "../../../etc/passwd",
        "../../secret.txt",
        "../secret.txt",
        "subdir/../../secret.txt",
        "../../../../usr/bin/node",
      ];

      for (const path of traversalPaths) {
        await expect(bridge.read(path)).rejects.toThrow("Path traversal detected");
        await expect(bridge.exists(path)).rejects.toThrow("Path traversal detected");
        await expect(bridge.write(path, "hacked")).rejects.toThrow("Path traversal detected");
        await expect(bridge.mkdir(path)).rejects.toThrow("Path traversal detected");
        await expect(bridge.rm(path)).rejects.toThrow("Path traversal detected");
      }
    });

    it("should prevent absolute path escapes", async () => {
      const testDir = await testdir({});
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      const dangerousPaths = [
        "/etc/passwd",
        "/usr/bin/node",
        "/tmp/hack.txt",
        `${process.cwd()}/package.json`,
      ];

      for (const path of dangerousPaths) {
        await expect(bridge.read(path)).rejects.toThrow(/Path traversal detected/);
        await expect(bridge.exists(path)).rejects.toThrow(/Path traversal detected/);
        await expect(bridge.write(path, "hacked")).rejects.toThrow(/Path traversal detected/);
      }
    });

    it("should allow valid paths within basePath", async () => {
      const testDir = await testdir({ "valid.txt": "content" });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      // these should work fine
      await expect(bridge.read("valid.txt")).resolves.toBe("content");
      await expect(bridge.exists("valid.txt")).resolves.toBe(true);
      await expect(bridge.write("new.txt", "data")).resolves.not.toThrow();
      await expect(bridge.mkdir("newdir")).resolves.not.toThrow();
    });

    it("should allow folders with system path names inside basePath", async () => {
      const testDir = await testdir({});
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      // should allow creating folders named after system paths within basePath
      await expect(bridge.mkdir("usr")).resolves.not.toThrow();
      await expect(bridge.mkdir("etc")).resolves.not.toThrow();
      await expect(bridge.mkdir("bin")).resolves.not.toThrow();

      await expect(bridge.write("usr/data.txt", "user data")).resolves.not.toThrow();
      await expect(bridge.write("etc/config.json", "{}")).resolves.not.toThrow();

      await expect(bridge.exists("usr")).resolves.toBe(true);
      await expect(bridge.read("usr/data.txt")).resolves.toBe("user data");
    });

    it("should handle edge cases safely", async () => {
      const testDir = await testdir({});
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      // test empty and root paths
      await expect(bridge.exists("")).resolves.toBe(true); // basePath itself
      await expect(bridge.exists(".")).resolves.toBe(true); // current dir

      // test paths that try to trick the validation
      await expect(bridge.read("./../../secret")).rejects.toThrow(/Path traversal detected/);
      await expect(bridge.read("valid/../../../secret")).rejects.toThrow(/Path traversal detected/);
    });

    describe("obscure path traversal attempts", async () => {
      const testDir = await testdir({});
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      it.each([
        "..%2F..%2F..%2Fetc%2Fpasswd",
        "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd",
        "%252e%252e%252f%252e%252e%252f%252e%252e%252fetc%252fpasswd",
        "..\u2215..\u2215..\u2215etc\u2215passwd", // Unicode division slash
        "..\\..\\..\\etc\\passwd", // Backslashes on Unix
        "...//...//...//etc//passwd", // Triple dots
      ])("should treat obscure path as literal filename: %s", async (obscurePath) => {
        // these paths should be treated as literal filenames (not as path traversal)
        // since path.resolve will not normalize them to critical paths
        await expect(bridge.read(obscurePath)).rejects.toThrow(/ENOENT/);
        await expect(bridge.exists(obscurePath)).resolves.toBe(false);
      });

      it.each([
        "..\u002F..\u002F..\u002Fetc\u002Fpasswd", // Unicode forward slash
        "../..\\../etc/passwd", // Mixed separators
        "../../../etc/passwd\0.txt", // Null byte
        `../${"../".repeat(100)}etc/passwd`, // Overlong path
        "../../../etc/passwd.", // Trailing dot
        "../../../etc/passwd ", // Trailing space
        "../../../ETC/PASSWD", // Case variations
        "../../../Etc/Passwd",
      ])("should prevent path traversal attack: %s", async (traversalPath) => {
        await expect(bridge.read(traversalPath)).rejects.toThrow(/Path traversal detected/);
        await expect(bridge.exists(traversalPath)).rejects.toThrow(/Path traversal detected/);
      });
    });

    // Since we are checking for traversal attacks, before critical system paths,
    // we can't verify that the bridge throws the correct critical system path error,
    // So i have just disabled these tests for now.
    describe.todo("critical system paths", () => {
      it.each([
        "/",
        "/usr",
        "/bin",
        "/sbin",
        "/etc",
        "/var",
        "/sys",
        "/proc",
        "/dev",
        "/boot",
      ])("should not allow access to critical system path: %s", async (criticalPath) => {
        const testDir = await testdir({});
        const bridge = NodeFileSystemBridge({ basePath: testDir });

        await expect(bridge.exists(criticalPath)).rejects.toThrow(/Critical system path access denied/);
        await expect(bridge.read(criticalPath)).rejects.toThrow(/Critical system path access denied/);
      });
    });
  });
});

import { isUnix } from "#test-utils";
import { describe, expect, it } from "vitest";
import { PathTraversalError } from "../src/errors";
import { isWithinBase, resolveSafePath } from "../src/security";
import { isCaseSensitive } from "../src/utils";

describe.runIf(isUnix)("security - unix", () => {
  describe("isWithinBase", () => {
    it("should handle absolute paths correctly", () => {
      expect.soft(isWithinBase("/home/user", "/home/user/documents/file.txt")).toBe(true);
      expect.soft(isWithinBase("/home/user", "/home/other/documents/file.txt")).toBe(false);
      expect.soft(isWithinBase("/home/user", "/var/log/system.log")).toBe(false);
    });

    it("should handle root paths", () => {
      expect.soft(isWithinBase("/var", "/var/log/file.txt")).toBe(true);
      expect.soft(isWithinBase("/var", "/etc/config")).toBe(false);
      expect.soft(isWithinBase("/", "/")).toBe(true);
      expect.soft(isWithinBase("/", "/home")).toBe(true);
      expect.soft(isWithinBase("/", "/var/log")).toBe(true);
    });

    it("should prevent partial path matches", () => {
      expect.soft(isWithinBase("/home/user", "/home/user2/file.txt")).toBe(false);
      expect.soft(isWithinBase("/home/user", "/home/username/file.txt")).toBe(false);
      expect.soft(isWithinBase("/var/log", "/var/log2/file.txt")).toBe(false);
    });

    it("should handle path normalization edge cases", () => {
      expect.soft(isWithinBase("/home/user", "/home/user/../user/documents/file.txt")).toBe(true);
      expect.soft(isWithinBase("/home/user", "/home/user/./documents/file.txt")).toBe(true);
      expect.soft(isWithinBase("/home/user", "/home/user/documents/../../other/file.txt")).toBe(false);
    });

    it("should handle same path comparison", () => {
      expect.soft(isWithinBase("/home/user", "/home/user")).toBe(true);
      expect.soft(isWithinBase("/var/www/html", "/var/www/html")).toBe(true);
    });
  });

  describe("resolveSafePath", () => {
    describe("virtual filesystem boundary", () => {
      it("should treat root as boundary root", () => {
        const result = resolveSafePath("/home/user", "/");

        expect(result).toBe("/home/user");
      });

      it("should resolve virtual absolute paths relative to boundary", () => {
        expect.soft(resolveSafePath("/home/user", "/documents/file.txt")).toBe("/home/user/documents/file.txt");
        expect.soft(resolveSafePath("/var/www/html", "/assets/css/style.css")).toBe("/var/www/html/assets/css/style.css");
      });

      it("should handle current directory references", () => {
        expect.soft(resolveSafePath("/home/user", ".")).toBe("/home/user");
        expect.soft(resolveSafePath("/home/user", "./")).toBe("/home/user");
        expect.soft(resolveSafePath("/var/www", "./html/index.html")).toBe("/var/www/html/index.html");
      });
    });

    describe("relative paths", () => {
      it("should handle relative paths correctly", () => {
        expect.soft(
          resolveSafePath("/home/user", "documents/projects/file.txt"),
        ).toBe("/home/user/documents/projects/file.txt");
        expect.soft(
          resolveSafePath("/var/www", "html/assets/images/logo.png"),
        ).toBe("/var/www/html/assets/images/logo.png");
      });

      it("should handle path normalization", () => {
        expect.soft(
          resolveSafePath("/home/user", "documents/../documents/file.txt"),
        ).toBe("/home/user/documents/file.txt");
        expect.soft(
          resolveSafePath("/var/www", "html/./assets/../assets/css/style.css"),
        ).toBe("/var/www/html/assets/css/style.css");
      });
    });

    describe("encoded paths", () => {
      it("should decode and resolve encoded paths", () => {
        expect(resolveSafePath("/home/user", "documents%2Ffile.txt")).toBe("/home/user/documents/file.txt");
      });
    });

    describe("absolute paths within boundary", () => {
      it("should use absolute paths when they are within base path", () => {
        const basePath = "/home/user/projects/app/.test-dirs/long-test-directory-name-for-filtering";
        const inputPath = "/home/user/projects/app/.test-dirs/long-test-directory-name-for-filtering/.config-store.json";

        expect.soft(resolveSafePath(basePath, inputPath)).toBe(inputPath);
      });

      it("should handle nested absolute paths within base", () => {
        expect.soft(resolveSafePath("/home/user", "/home/user/documents/file.txt")).toBe("/home/user/documents/file.txt");
        expect.soft(resolveSafePath("/var/www/html", "/var/www/html/assets/style.css")).toBe("/var/www/html/assets/style.css");
      });

      it("should handle exact base path match", () => {
        expect.soft(resolveSafePath("/home/user", "/home/user")).toBe("/home/user");
        expect.soft(resolveSafePath("/var/www", "/var/www")).toBe("/var/www");
      });
    });

    describe("absolute paths outside boundary", () => {
      it("should treat outside absolute paths as relative", () => {
        expect.soft(resolveSafePath("/home/user", "/etc/config.txt")).toBe("/home/user/etc/config.txt");
        expect.soft(resolveSafePath("/var/www/html", "/usr/share/icons/logo.png")).toBe("/var/www/html/usr/share/icons/logo.png");
      });
    });

    describe("path traversal prevention", () => {
      it("should prevent directory traversal attacks", () => {
        expect.soft(
          () => resolveSafePath("/home/user/documents", "../../etc/passwd"),
        ).toThrowError(new PathTraversalError("/home/user/documents", "/home/etc/passwd"));
        expect.soft(
          () => resolveSafePath("/var/www/html", "../../../etc/shadow"),
        ).toThrowError(new PathTraversalError("/var/www/html", "/etc/shadow"));
        expect.soft(
          () => resolveSafePath("/home/user", "../../../root/.ssh/id_rsa"),
        ).toThrowError(new PathTraversalError("/home/user", "/root/.ssh/id_rsa"));
      });

      it("should prevent encoded traversal attacks", () => {
        expect.soft(
          () => resolveSafePath("/home/user/documents", "%2e%2e%2f%2e%2e%2fetc%2fpasswd"),
        ).toThrowError(new PathTraversalError("/home/user/documents", "/home/etc/passwd"));
        expect.soft(
          () => resolveSafePath("/home/user", "%252e%252e%252f%252e%252e%252fetc"),
        ).toThrowError(new PathTraversalError("/home/user", "/etc"));
        expect.soft(
          () => resolveSafePath("/home/user/docs", "\u002E\u002E/\u002E\u002E/etc/passwd"),
        ).toThrowError(new PathTraversalError("/home/user/docs", "/home/etc/passwd"));
      });
    });

    // TODO: figure out if we wanna handle this
    // It seems very problematic that the case sensitivity of paths is not consistent across different filesystems.
    describe("case sensitivity", () => {
      // linux
      it.runIf(isCaseSensitive)("should be case-sensitive on case-sensitive filesystems", () => {
        expect.soft(resolveSafePath("/home/user", "File.txt")).toBe("/home/user/File.txt");
        expect.soft(resolveSafePath("/home/user", "file.txt")).toBe("/home/user/file.txt");
        expect.soft(resolveSafePath("/home/user", "/Home/user/file.txt")).toBe("/home/user/Home/user/file.txt");
      });

      it.runIf(!isCaseSensitive)("should handle case-insensitive behavior on case-insensitive filesystems", () => {
        expect.soft(resolveSafePath("/home/user", "File.txt")).toBe("/home/user/File.txt");
        expect.soft(resolveSafePath("/home/user", "file.txt")).toBe("/home/user/file.txt");
        // On case-insensitive systems, /Home/user matches /home/user, so it's treated as within boundary
        expect.soft(resolveSafePath("/home/user", "/Home/user/file.txt")).toBe("/home/user/file.txt");
      });
    });

    describe("special characters", () => {
      it("should handle special characters in paths", () => {
        expect.soft(resolveSafePath("/home/user", "My Documents/file.txt")).toBe("/home/user/My Documents/file.txt");
        expect.soft(resolveSafePath("/home/user", "projects/my-app_v2.0/file.txt")).toBe("/home/user/projects/my-app_v2.0/file.txt");
        expect.soft(resolveSafePath("/home/user", "config/.bashrc")).toBe("/home/user/config/.bashrc");
      });
    });

    describe("unix error cases", () => {
      it("should handle Unix paths with null bytes", () => {
        expect(() => {
          resolveSafePath("/home/user", "file.txt\0");
        }).toThrow(/Illegal character detected in path: '\0'/);
      });

      it("should handle Unix paths with control characters", () => {
        expect(() => {
          resolveSafePath("/home/user", "file\x01.txt");
        // eslint-disable-next-line no-control-regex
        }).toThrow(/Illegal character detected in path: ''/);
      });

      it("should handle empty input path", () => {
        expect(resolveSafePath("/home/user", "")).toBe("/home/user");
      });

      it("should handle malformed encoding", () => {
        expect(resolveSafePath("/home/user", "%gg%hh")).toBe("/home/user/%gg%hh");
      });
    });

    describe("unix path normalization output", () => {
      it("should return properly normalized Unix paths", () => {
        const result = resolveSafePath("/home/user", "documents/../documents/file.txt");
        expect(result).toBe("/home/user/documents/file.txt");
      });

      it("should handle Unix long paths correctly", () => {
        const longPath = "very/long/path/with/many/segments/file.txt";
        const result = resolveSafePath("/home/user", longPath);
        expect(result).toBe("/home/user/very/long/path/with/many/segments/file.txt");
      });

      it("should normalize redundant separators", () => {
        const result = resolveSafePath("/home/user", "documents///projects//file.txt");
        expect(result).toBe("/home/user/documents/projects/file.txt");
      });

      it("should handle complex normalization", () => {
        const result = resolveSafePath("/var/www", "html/./assets/../assets/css/style.css");
        expect(result).toBe("/var/www/html/assets/css/style.css");
      });
    });

    describe("unix system paths", () => {
      it("should handle typical Unix system boundaries", () => {
        const result1 = resolveSafePath("/var/log", "apache2/access.log");
        expect.soft(result1).toBe("/var/log/apache2/access.log");

        const result2 = resolveSafePath("/usr/local/bin", "custom-script.sh");
        expect.soft(result2).toBe("/usr/local/bin/custom-script.sh");
      });

      it("should prevent access to sensitive system files", () => {
        expect.soft(() => {
          resolveSafePath("/home/user/public", "../../etc/passwd");
        }).toThrowError(new PathTraversalError("/home/user/public", "/home/etc/passwd"));

        expect.soft(() => {
          resolveSafePath("/var/www/html", "../../../root/.bashrc");
        }).toThrowError(new PathTraversalError("/var/www/html", "/root/.bashrc"));
      });
    });
  });
});

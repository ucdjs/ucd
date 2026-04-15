/// <reference types="../../../../../packages/test-utils/src/matchers/types.d.ts" />

import { createDatabase } from "#db";
import { versions } from "#db/schema";
import * as taskLib from "@ucdjs-internal/worker-utils";
import { introspectWorkflowInstance } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { executeRequest } from "../../helpers/request";

const TASK_API_KEY = "b8539abb-f2e9-4f6f-86b3-36df26d752b4";
const manifestVersion = "16.0.0";
const manifestContentType = "application/gzip";
const mockFileEntries = [{ name: "manifest.json", data: new ArrayBuffer(1) }];
const originalWorkflow = env.MANIFEST_UPLOAD_WORKFLOW;

const tarData = new Uint8Array([0x1F, 0x8B]); // gzip magic bytes

beforeEach(() => {
  vi.restoreAllMocks();
  env.MANIFEST_UPLOAD_WORKFLOW = originalWorkflow;

  // I couldn't figure out how to setup mock secret stores.
  // So this is the best, i can currently think of.
  env.UCDJS_TASK_API_KEY = {
    get: vi.fn().mockResolvedValue(TASK_API_KEY),
  };

  vi.spyOn(taskLib, "makeManifestUploadId").mockImplementation((version) => {
    const normalizedVersion = version.replace(/\./g, "-");
    const slug = btoa(expect.getState().currentTestName!.toLowerCase().replace(/[^a-z0-9]+/g, "-")).substring(0, 20);
    const instanceId = `manifest-upload-${normalizedVersion}-${slug}`;

    if (!taskLib.isValidWorkflowInstanceId(instanceId)) {
      throw new Error(`Generated workflow instance ID is invalid: ${instanceId}`);
    }

    return instanceId;
  });
});

describe("tasks", () => {
  // eslint-disable-next-line test/prefer-lowercase-title
  describe("POST /_tasks/upload-manifest", () => {
    it("should return 202 with workflow ID when successful", async () => {
      const workflowId = taskLib.makeManifestUploadId(manifestVersion);
      await using instance = await introspectWorkflowInstance(env.MANIFEST_UPLOAD_WORKFLOW, workflowId);
      await instance.modify(async (m) => {
        await m.disableSleeps();
        await m.mockStepResult({ name: "extract-tar" }, mockFileEntries);
        await m.mockStepResult({ name: "upload-files" }, [{ name: "manifest.json", success: true }]);
        await m.mockStepResult({ name: "validate-upload" }, { validated: true, fileCount: 1 });
        await m.mockStepResult({ name: "purge-caches" }, { ok: true });
        await m.mockStepResult({ name: "cleanup-tar" }, { ok: true });
      });

      const { response, json } = await executeRequest(
        new Request(`https://api.ucdjs.dev/_tasks/upload-manifest?version=${manifestVersion}`, {
          method: "POST",
          headers: {
            "Content-Type": manifestContentType,
            "X-UCDJS-Task-Key": TASK_API_KEY,
            "Content-Length": tarData.byteLength.toString(),
          },
          body: tarData,
        }),
        env,
      );

      expect(response).toMatchResponse({
        status: 202,
        json: true,
        cache: false,
      });

      const data = await json();
      expect(data).toMatchObject({
        success: true,
        workflowId,
        status: "queued",
        statusUrl: expect.stringContaining("/_tasks/upload-status/"),
      });

      await expect(instance.waitForStatus("complete")).resolves.not.toThrow();
      const output = await instance.getOutput();
      expect(output).toMatchObject({
        success: true,
        version: "16.0.0",
        filesUploaded: 1,
        workflowId,
      });
    });

    it("should return 400 when version is missing", async () => {
      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/_tasks/upload-manifest", {
          method: "POST",
          headers: {
            "Content-Type": "application/gzip",
            "X-UCDJS-Task-Key": TASK_API_KEY,
          },
          body: new Uint8Array([0x1F, 0x8B]),
        }),
        env,
      );

      expect(response).toMatchResponse({
        status: 400,
        error: {
          message: "Missing 'version' query parameter",
        },
      });
    });

    it("should return 400 when version format is invalid", async () => {
      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/_tasks/upload-manifest?version=16.0", {
          method: "POST",
          headers: {
            "Content-Type": "application/gzip",
            "X-UCDJS-Task-Key": TASK_API_KEY,
          },
          body: new Uint8Array([0x1F, 0x8B]),
        }),
        env,
      );

      expect(response).toMatchResponse({
        status: 400,
        error: {
          message: /Invalid version format/,
        },
      });
    });

    it("should return 400 when Content-Type is invalid", async () => {
      const { response } = await executeRequest(
        new Request(`https://api.ucdjs.dev/_tasks/upload-manifest?version=${manifestVersion}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-UCDJS-Task-Key": TASK_API_KEY,
          },
          body: new Uint8Array([0x1F, 0x8B]),
        }),
        env,
      );

      expect(response).toMatchResponse({
        status: 400,
        error: {
          message: "Content-Type must be application/x-tar or application/gzip",
        },
      });
    });

    it("should return 400 when TAR file exceeds size limit", async () => {
      // Create a buffer larger than 10MB
      const largeBuffer = new Uint8Array(11 * 1024 * 1024);

      const { response } = await executeRequest(
        new Request(`https://api.ucdjs.dev/_tasks/upload-manifest?version=${manifestVersion}`, {
          method: "POST",
          headers: {
            "Content-Type": manifestContentType,
            "X-UCDJS-Task-Key": TASK_API_KEY,
            "Content-Length": largeBuffer.byteLength.toString(),
          },
          body: largeBuffer,
        }),
        env,
      );

      expect(response).toMatchResponse({
        status: 400,
        error: {
          message: /exceeds maximum size of 10MB/,
        },
      });
    });

    it("should return 502 when the upload workflow binding is not configured", async () => {
      // Remove workflow binding
      delete (env as any).MANIFEST_UPLOAD_WORKFLOW;

      const { response } = await executeRequest(
        new Request(`https://api.ucdjs.dev/_tasks/upload-manifest?version=${manifestVersion}`, {
          method: "POST",
          headers: {
            "Content-Type": manifestContentType,
            "X-UCDJS-Task-Key": TASK_API_KEY,
          },
          body: new Uint8Array([0x1F, 0x8B]),
        }),
        env,
      );

      expect(response).toMatchResponse({
        status: 502,
      });
    });

    it("should return 502 when upload workflow creation fails", async () => {
      vi.spyOn(env.MANIFEST_UPLOAD_WORKFLOW, "create").mockRejectedValue(new Error("Workflow creation failed"));

      const { response } = await executeRequest(
        new Request(`https://api.ucdjs.dev/_tasks/upload-manifest?version=${manifestVersion}`, {
          method: "POST",
          headers: {
            "Content-Type": manifestContentType,
            "X-UCDJS-Task-Key": TASK_API_KEY,
          },
          body: new Uint8Array([0x1F, 0x8B]),
        }),
        env,
      );

      expect(response).toMatchResponse({
        status: 502,
      });
    });
  });

  // eslint-disable-next-line test/prefer-lowercase-title
  describe("GET /_tasks/upload-status/:workflowId", () => {
    it("should return 400 when workflow status is not found", async () => {
      const workflowId = taskLib.makeManifestUploadId(manifestVersion);
      env.MANIFEST_UPLOAD_WORKFLOW = {
        get: vi.fn().mockRejectedValue(new Error("instance.not_found")),
      } as any as typeof env.MANIFEST_UPLOAD_WORKFLOW;

      const { response } = await executeRequest(
        new Request(`https://api.ucdjs.dev/_tasks/upload-status/${workflowId}`, {
          headers: {
            "X-UCDJS-Task-Key": TASK_API_KEY,
          },
        }),
        env,
      );

      expect(response).toMatchResponse({
        status: 400,
        error: {
          message: "Invalid workflow ID or workflow not found",
        },
      });
    });

    it("should return 502 when the status workflow binding is not configured", async () => {
      const workflowId = taskLib.makeManifestUploadId(manifestVersion);
      delete (env as any).MANIFEST_UPLOAD_WORKFLOW;

      const { response } = await executeRequest(
        new Request(`https://api.ucdjs.dev/_tasks/upload-status/${workflowId}`, {
          headers: {
            "X-UCDJS-Task-Key": TASK_API_KEY,
          },
        }),
        env,
      );

      expect(response).toMatchResponse({
        status: 502,
      });
    });

    it("should handle completed workflow with output", async () => {
      const workflowId = taskLib.makeManifestUploadId(manifestVersion);
      await using instance = await introspectWorkflowInstance(env.MANIFEST_UPLOAD_WORKFLOW, workflowId);
      await instance.modify(async (m) => {
        await m.disableSleeps();
        await m.mockStepResult({ name: "extract-tar" }, mockFileEntries);
        await m.mockStepResult({ name: "upload-files" }, [{ name: "manifest.json", success: true }]);
        await m.mockStepResult({ name: "validate-upload" }, { validated: true, fileCount: 1 });
        await m.mockStepResult({ name: "purge-caches" }, { ok: true });
        await m.mockStepResult({ name: "cleanup-tar" }, { ok: true });
      });
      await env.MANIFEST_UPLOAD_WORKFLOW.create({
        id: workflowId,
        params: {
          version: manifestVersion,
          r2Key: taskLib.buildR2Key(manifestVersion, workflowId),
        },
      });
      await expect(instance.waitForStatus("complete")).resolves.not.toThrow();

      const { response, json } = await executeRequest(
        new Request(`https://api.ucdjs.dev/_tasks/upload-status/${workflowId}`, {
          headers: {
            "X-UCDJS-Task-Key": TASK_API_KEY,
          },
        }),
        env,
      );

      expect(response).toMatchResponse({
        status: 200,
        json: true,
        cache: false,
      });
      const data = await json();
      expect(data).toMatchObject({
        workflowId,
        status: "complete",
        output: {
          success: true,
          version: "16.0.0",
          filesUploaded: 1,
        },
      });
    });

    // WHY DOES THIS TAKE SO LONG? WHAT THE CRAP
    it.todo("should handle errored workflow", { timeout: 30000 }, async () => {
      const workflowId = taskLib.makeManifestUploadId(manifestVersion);
      await using instance = await introspectWorkflowInstance(env.MANIFEST_UPLOAD_WORKFLOW, workflowId);
      await instance.modify(async (m) => {
        await m.disableSleeps();
        await m.mockStepResult({ name: "extract-tar" }, mockFileEntries);
        await m.mockStepResult({ name: "upload-files" }, [{ name: "manifest.json", success: true }]);
        await m.mockStepError({ name: "validate-upload" }, new Error("Simulated validation error"), 1);
        await m.forceStepTimeout({ name: "purge-caches" });
        await m.forceStepTimeout({ name: "cleanup-tar" });
      });

      await env.MANIFEST_UPLOAD_WORKFLOW.create({
        id: workflowId,
        params: {
          version: manifestVersion,
          r2Key: taskLib.buildR2Key(manifestVersion, workflowId),
        },
      });

      await expect(instance.waitForStatus("errored")).resolves.not.toThrow();
      const error = await instance.getError();
      expect(error.message).toContain("Simulated validation error");

      const { response: statusResponse, json } = await executeRequest(
        new Request(`https://api.ucdjs.dev/_tasks/upload-status/${workflowId}`, {
          headers: {
            "X-UCDJS-Task-Key": TASK_API_KEY,
          },
        }),
        env,
      );

      expect(statusResponse).toMatchResponse({
        status: 200,
        json: true,
        cache: false,
      });

      const data = await json();
      expect(data).toMatchObject({
        workflowId,
        status: "errored",
        error: error.message,
      });
    });
  });

  // eslint-disable-next-line test/prefer-lowercase-title
  describe("POST /_tasks/reindex-versions", () => {
    it("should rebuild a D1 version row from Unicode metadata only", async () => {
      const { response, json } = await executeRequest(
        new Request("https://api.ucdjs.dev/_tasks/reindex-versions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-UCDJS-Task-Key": TASK_API_KEY,
          },
          body: JSON.stringify({
            versions: ["16.0.0"],
          }),
        }),
        env,
      );

      expect(response).toMatchResponse({
        status: 200,
        json: true,
        cache: false,
      });

      await expect(json()).resolves.toMatchObject({
        success: true,
        indexed: 1,
        skipped: 0,
        results: [
          {
            version: "16.0.0",
            indexed: true,
          },
        ],
      });

      const db = createDatabase(env.UCD_DATA);
      const [row] = await db.select().from(versions).where(eq(versions.version, "16.0.0")).limit(1);

      expect(row).toMatchObject({
        version: "16.0.0",
        status: "stable",
        fileCount: null,
        manifestPath: null,
        snapshotPath: null,
        documentationUrl: "https://www.unicode.org/versions/Unicode16.0.0/",
        url: "https://www.unicode.org/Public/16.0.0",
      });
    });

    it("should clear stale publish metadata when reindexing an existing row", async () => {
      const db = createDatabase(env.UCD_DATA);
      const seededAt = new Date("2026-04-15T00:00:00.000Z");

      await db.insert(versions).values({
        version: "16.0.0",
        major: 16,
        minor: 0,
        patch: 0,
        documentationUrl: "https://www.unicode.org/versions/Unicode16.0.0/",
        date: "2024-09-10",
        url: "https://www.unicode.org/Public/16.0.0",
        mappedUcdVersion: null,
        status: "stable",
        manifestPath: "16.0.0/manifest.json",
        snapshotPath: "16.0.0/snapshot.json",
        fileCount: 123,
        totalSize: 456,
        publishedAt: seededAt,
        indexedAt: seededAt,
        createdAt: seededAt,
        updatedAt: seededAt,
      });

      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/_tasks/reindex-versions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-UCDJS-Task-Key": TASK_API_KEY,
          },
          body: JSON.stringify({
            versions: ["16.0.0"],
          }),
        }),
        env,
      );

      expect(response).toMatchResponse({
        status: 200,
        json: true,
        cache: false,
      });

      const [row] = await db.select().from(versions).where(eq(versions.version, "16.0.0")).limit(1);

      expect(row).toMatchObject({
        version: "16.0.0",
        manifestPath: null,
        snapshotPath: null,
        fileCount: null,
        totalSize: null,
        publishedAt: null,
      });
    });

    it("should reindex requested versions even when no manifest exists in R2", async () => {
      const { response, json } = await executeRequest(
        new Request("https://api.ucdjs.dev/_tasks/reindex-versions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-UCDJS-Task-Key": TASK_API_KEY,
          },
          body: JSON.stringify({
            versions: ["15.1.0"],
          }),
        }),
        env,
      );

      expect(response).toMatchResponse({
        status: 200,
        json: true,
        cache: false,
      });

      await expect(json()).resolves.toMatchObject({
        success: true,
        indexed: 1,
        skipped: 0,
        results: [
          {
            version: "15.1.0",
            indexed: true,
          },
        ],
      });
    });

    it("should return 400 when the request body is invalid JSON", async () => {
      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/_tasks/reindex-versions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-UCDJS-Task-Key": TASK_API_KEY,
          },
          body: "{",
        }),
        env,
      );

      expect(response).toMatchResponse({
        status: 400,
        error: {
          message: "Request body must be valid JSON",
        },
      });
    });

    it("should return 400 when a requested version is unsupported", async () => {
      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/_tasks/reindex-versions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-UCDJS-Task-Key": TASK_API_KEY,
          },
          body: JSON.stringify({
            versions: ["99.0.0"],
          }),
        }),
        env,
      );

      expect(response).toMatchResponse({
        status: 400,
        error: {
          message: "Unsupported reindex version(s): 99.0.0. Update @unicode-utils/core metadata first.",
        },
      });
    });
  });
});

import { introspectWorkflowInstance } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as taskLib from "../../../src/lib/tasks";
import { executeRequest } from "../../helpers/request";
import { expectApiError, expectJsonResponse, expectSuccess } from "../../helpers/response";

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

      expectSuccess(response, { status: 202 });
      expectJsonResponse(response);

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

      await expectApiError(response, {
        status: 400,
        message: "Missing 'version' query parameter",
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

      await expectApiError(response, {
        status: 400,
        message: /Invalid version format/,
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

      await expectApiError(response, {
        status: 400,
        message: "Content-Type must be application/x-tar or application/gzip",
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

      await expectApiError(response, {
        status: 400,
        message: /exceeds maximum size of 10MB/,
      });
    });

    it("should return 502 when workflow binding is not configured", async () => {
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

      await expectApiError(response, {
        status: 502,
      });
    });

    it("should return 502 when workflow creation fails", async () => {
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

      await expectApiError(response, {
        status: 502,
      });
    });
  });

  // eslint-disable-next-line test/prefer-lowercase-title
  describe("GET /_tasks/upload-status/:workflowId", () => {
    it("should return workflow status when successful", async () => {
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

      expectSuccess(response);
      expectJsonResponse(response);

      const data = await json();
      expect(data).toMatchObject({
        workflowId,
        status: "complete",
      });
    });

    it("should return 400 when workflow ID is missing", async () => {
      // This test actually can't happen with the current route definition
      // since :workflowId is a required parameter
      // But we test the empty string case
      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/_tasks/upload-status/", {
          headers: {
            "X-UCDJS-Task-Key": TASK_API_KEY,
          },
        }),
        env,
      );

      // This will be a 404 from the router, not our handler
      expect(response.status).toBe(404);
    });

    it("should return 400 when workflow is not found", async () => {
      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/_tasks/upload-status/non-existent-id", {
          headers: {
            "X-UCDJS-Task-Key": TASK_API_KEY,
          },
        }),
        env,
      );

      await expectApiError(response, {
        status: 400,
        message: "Invalid workflow ID or workflow not found",
      });
    });

    it("should return 502 when workflow binding is not configured", async () => {
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

      await expectApiError(response, {
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

      expectSuccess(response);
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
      expectSuccess(statusResponse);
      const data = await json();
      expect(data).toMatchObject({
        workflowId,
        status: "errored",
        error: error.message,
      });
    });
  });
});

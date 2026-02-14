import { introspectWorkflowInstance } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as taskIds from "../../../src/routes/tasks/ids";
import { executeRequest } from "../../helpers/request";
import { expectApiError, expectJsonResponse, expectSuccess } from "../../helpers/response";

const fixedWorkflowId = "manifest-upload-16-0-0-1234567890";
const manifestParams = {
  version: "16.0.0",
  tarData: "AA==",
  contentType: "application/gzip",
} as const;
const mockFileEntries = [{ name: "manifest.json", data: new ArrayBuffer(1) }];

beforeEach(() => {
  vi.restoreAllMocks();

  // I couldn't figure out how to setup mock secret stores.
  // So this is the best, i can currently think of.
  env.UCDJS_TASK_API_KEY = {
    get: vi.fn().mockResolvedValue("test-api-key"),
  };

  vi.spyOn(taskIds, "makeManifestUploadId").mockReturnValue(fixedWorkflowId);
});

describe("tasks", () => {
  // eslint-disable-next-line test/prefer-lowercase-title
  describe("POST /_tasks/upload-manifest", () => {
    it("should return 202 with workflow ID when successful", async () => {
      await using instance = await introspectWorkflowInstance(env.MANIFEST_UPLOAD_WORKFLOW, fixedWorkflowId);
      await instance.modify(async (m) => {
        await m.disableSleeps();
        await m.mockStepResult({ name: "extract-tar" }, mockFileEntries);
        await m.mockStepResult({ name: "upload-files" }, [{ name: "manifest.json", success: true }]);
        await m.mockStepResult({ name: "validate-upload" }, { validated: true, fileCount: 1 });
        await m.mockStepResult({ name: "purge-caches" }, { ok: true });
      });

      // Create a simple TAR file (just a few bytes)
      const tarData = new Uint8Array([0x1F, 0x8B]); // gzip magic bytes

      const { response, json } = await executeRequest(
        new Request("https://api.ucdjs.dev/_tasks/upload-manifest?version=16.0.0", {
          method: "POST",
          headers: {
            "Content-Type": "application/gzip",
            "X-UCDJS-Task-Key": "test-api-key",
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
        workflowId: fixedWorkflowId,
        status: "queued",
        statusUrl: expect.stringContaining("/_tasks/upload-status/"),
      });

      await expect(instance.waitForStatus("complete")).resolves.not.toThrow();
      const output = await instance.getOutput();
      expect(output).toMatchObject({
        success: true,
        version: "16.0.0",
        filesUploaded: 1,
        workflowId: fixedWorkflowId,
      });
    });

    it("should return 400 when version is missing", async () => {
      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/_tasks/upload-manifest", {
          method: "POST",
          headers: {
            "Content-Type": "application/gzip",
            "X-UCDJS-Task-Key": "test-api-key",
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
            "X-UCDJS-Task-Key": "test-api-key",
          },
          body: new Uint8Array([0x1F, 0x8B]),
        }),
        env,
      );

      await expectApiError(response, {
        status: 400,
        message: expect.stringContaining("Invalid version format"),
      });
    });

    it("should return 400 when Content-Type is invalid", async () => {
      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/_tasks/upload-manifest?version=16.0.0", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-UCDJS-Task-Key": "test-api-key",
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
      // Create a buffer larger than 50MB
      const largeBuffer = new Uint8Array(51 * 1024 * 1024);

      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/_tasks/upload-manifest?version=16.0.0", {
          method: "POST",
          headers: {
            "Content-Type": "application/gzip",
            "X-UCDJS-Task-Key": "test-api-key",
          },
          body: largeBuffer,
        }),
        env,
      );

      await expectApiError(response, {
        status: 400,
        message: expect.stringContaining("exceeds maximum of 50MB"),
      });
    });

    it("should return 502 when workflow binding is not configured", async () => {
      // Remove workflow binding
      delete (env as any).MANIFEST_UPLOAD_WORKFLOW;

      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/_tasks/upload-manifest?version=16.0.0", {
          method: "POST",
          headers: {
            "Content-Type": "application/gzip",
            "X-UCDJS-Task-Key": "test-api-key",
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
        new Request("https://api.ucdjs.dev/_tasks/upload-manifest?version=16.0.0", {
          method: "POST",
          headers: {
            "Content-Type": "application/gzip",
            "X-UCDJS-Task-Key": "test-api-key",
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
      const pending = new Promise<never>(() => {});
      await using instance = await introspectWorkflowInstance(env.MANIFEST_UPLOAD_WORKFLOW, fixedWorkflowId);
      await instance.modify(async (m) => {
        await m.disableSleeps();
        await m.mockStepResult({ name: "extract-tar" }, mockFileEntries);
        await m.mockStepResult({ name: "upload-files" }, pending);
      });
      await env.MANIFEST_UPLOAD_WORKFLOW.create({ id: fixedWorkflowId, params: manifestParams });
      await expect(instance.waitForStatus("running")).resolves.not.toThrow();

      const { response, json } = await executeRequest(
        new Request(`https://api.ucdjs.dev/_tasks/upload-status/${fixedWorkflowId}`),
        env,
      );

      expectSuccess(response);
      expectJsonResponse(response);

      const data = await json();
      expect(data).toMatchObject({
        workflowId: fixedWorkflowId,
        status: "running",
      });
    });

    it("should return 400 when workflow ID is missing", async () => {
      // This test actually can't happen with the current route definition
      // since :workflowId is a required parameter
      // But we test the empty string case
      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/_tasks/upload-status/"),
        env,
      );

      // This will be a 404 from the router, not our handler
      expect(response.status).toBe(404);
    });

    it("should return 400 when workflow is not found", async () => {
      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/_tasks/upload-status/non-existent-id"),
        env,
      );

      await expectApiError(response, {
        status: 400,
        message: "Invalid workflow ID or workflow not found",
      });
    });

    it("should return 502 when workflow binding is not configured", async () => {
      delete (env as any).MANIFEST_UPLOAD_WORKFLOW;

      const { response } = await executeRequest(
        new Request(`https://api.ucdjs.dev/_tasks/upload-status/${fixedWorkflowId}`),
        env,
      );

      await expectApiError(response, {
        status: 502,
      });
    });

    it("should handle completed workflow with output", async () => {
      await using instance = await introspectWorkflowInstance(env.MANIFEST_UPLOAD_WORKFLOW, fixedWorkflowId);
      await instance.modify(async (m) => {
        await m.disableSleeps();
        await m.mockStepResult({ name: "extract-tar" }, mockFileEntries);
        await m.mockStepResult({ name: "upload-files" }, [{ name: "manifest.json", success: true }]);
        await m.mockStepResult({ name: "validate-upload" }, { validated: true, fileCount: 1 });
        await m.mockStepResult({ name: "purge-caches" }, { ok: true });
      });
      await env.MANIFEST_UPLOAD_WORKFLOW.create({ id: fixedWorkflowId, params: manifestParams });
      await expect(instance.waitForStatus("complete")).resolves.not.toThrow();

      const { response, json } = await executeRequest(
        new Request(`https://api.ucdjs.dev/_tasks/upload-status/${fixedWorkflowId}`),
        env,
      );

      expectSuccess(response);
      const data = await json();
      expect(data).toMatchObject({
        workflowId: fixedWorkflowId,
        status: "complete",
        output: {
          success: true,
          version: "16.0.0",
          filesUploaded: 1,
        },
      });
    });

    it("should handle errored workflow", async () => {
      await using instance = await introspectWorkflowInstance(env.MANIFEST_UPLOAD_WORKFLOW, fixedWorkflowId);
      await instance.modify(async (m) => {
        await m.disableSleeps();
        await m.mockStepError({ name: "extract-tar" }, new Error("Simulated extraction error"));
      });
      await env.MANIFEST_UPLOAD_WORKFLOW.create({ id: fixedWorkflowId, params: manifestParams });
      await expect(instance.waitForStatus("errored")).resolves.not.toThrow();
      const error = await instance.getError();

      const { response, json } = await executeRequest(
        new Request(`https://api.ucdjs.dev/_tasks/upload-status/${fixedWorkflowId}`),
        env,
      );

      expectSuccess(response);
      const data = await json();
      expect(data).toMatchObject({
        workflowId: fixedWorkflowId,
        status: "errored",
        error,
      });
    });
  });
});

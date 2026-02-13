import { env } from "cloudflare:workers";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { executeRequest } from "../../helpers/request";
import { expectApiError, expectJsonResponse, expectSuccess } from "../../helpers/response";

// Mock the workflow binding
const mockWorkflowCreate = vi.fn();
const mockWorkflowGet = vi.fn();
const mockInstanceStatus = vi.fn();

beforeEach(() => {
  vi.resetAllMocks();

  // Setup workflow binding mock
  (env as any).MANIFEST_UPLOAD_WORKFLOW = {
    create: mockWorkflowCreate,
    get: mockWorkflowGet,
  };
});

describe("tasks", () => {
  // eslint-disable-next-line test/prefer-lowercase-title
  describe("POST /_tasks/upload-manifest", () => {
    it("should return 202 with workflow ID when successful", async () => {
      const mockInstance = {
        id: "manifest-upload-16.0.0-1234567890",
      };
      mockWorkflowCreate.mockResolvedValue(mockInstance);

      // Create a simple TAR file (just a few bytes)
      const tarData = new Uint8Array([0x1F, 0x8B]); // gzip magic bytes

      const { response, json } = await executeRequest(
        new Request("https://api.ucdjs.dev/_tasks/upload-manifest?version=16.0.0", {
          method: "POST",
          headers: {
            "Content-Type": "application/gzip",
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
        workflowId: "manifest-upload-16.0.0-1234567890",
        status: "queued",
        statusUrl: expect.stringContaining("/_tasks/upload-status/"),
      });

      expect(mockWorkflowCreate).toHaveBeenCalledWith({
        id: expect.stringContaining("manifest-upload-16.0.0-"),
        params: {
          version: "16.0.0",
          tarData: expect.any(String),
          contentType: "application/gzip",
        },
      });
    });

    it("should return 400 when version is missing", async () => {
      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/_tasks/upload-manifest", {
          method: "POST",
          headers: {
            "Content-Type": "application/gzip",
          },
          body: new Uint8Array([0x1F, 0x8B]),
        }),
        env,
      );

      await expectApiError(response, {
        status: 400,
        message: "Missing 'version' query parameter",
      });

      expect(mockWorkflowCreate).not.toHaveBeenCalled();
    });

    it("should return 400 when version format is invalid", async () => {
      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/_tasks/upload-manifest?version=16.0", {
          method: "POST",
          headers: {
            "Content-Type": "application/gzip",
          },
          body: new Uint8Array([0x1F, 0x8B]),
        }),
        env,
      );

      await expectApiError(response, {
        status: 400,
        message: expect.stringContaining("Invalid version format"),
      });

      expect(mockWorkflowCreate).not.toHaveBeenCalled();
    });

    it("should return 400 when Content-Type is invalid", async () => {
      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/_tasks/upload-manifest?version=16.0.0", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: new Uint8Array([0x1F, 0x8B]),
        }),
        env,
      );

      await expectApiError(response, {
        status: 400,
        message: "Content-Type must be application/x-tar or application/gzip",
      });

      expect(mockWorkflowCreate).not.toHaveBeenCalled();
    });

    it("should return 400 when TAR file exceeds size limit", async () => {
      // Create a buffer larger than 50MB
      const largeBuffer = new Uint8Array(51 * 1024 * 1024);

      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/_tasks/upload-manifest?version=16.0.0", {
          method: "POST",
          headers: {
            "Content-Type": "application/gzip",
          },
          body: largeBuffer,
        }),
        env,
      );

      await expectApiError(response, {
        status: 400,
        message: expect.stringContaining("exceeds maximum of 50MB"),
      });

      expect(mockWorkflowCreate).not.toHaveBeenCalled();
    });

    it("should return 502 when workflow binding is not configured", async () => {
      // Remove workflow binding
      delete (env as any).MANIFEST_UPLOAD_WORKFLOW;

      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/_tasks/upload-manifest?version=16.0.0", {
          method: "POST",
          headers: {
            "Content-Type": "application/gzip",
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
      mockWorkflowCreate.mockRejectedValue(new Error("Workflow creation failed"));

      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/_tasks/upload-manifest?version=16.0.0", {
          method: "POST",
          headers: {
            "Content-Type": "application/gzip",
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
      mockInstanceStatus.mockResolvedValue({
        status: "running",
        output: { filesUploaded: 5 },
        error: undefined,
      });

      mockWorkflowGet.mockReturnValue({
        status: mockInstanceStatus,
      });

      const { response, json } = await executeRequest(
        new Request("https://api.ucdjs.dev/_tasks/upload-status/manifest-upload-16.0.0-1234567890"),
        env,
      );

      expectSuccess(response);
      expectJsonResponse(response);

      const data = await json();
      expect(data).toMatchObject({
        workflowId: "manifest-upload-16.0.0-1234567890",
        status: "running",
        output: { filesUploaded: 5 },
        error: undefined,
      });

      expect(mockWorkflowGet).toHaveBeenCalledWith("manifest-upload-16.0.0-1234567890");
      expect(mockInstanceStatus).toHaveBeenCalled();
    });

    it("should return 400 when workflow ID is missing", async () => {
      // This test actually can't happen with the current route definition
      // since :workflowId is a required parameter
      // But we test the empty string case
      mockWorkflowGet.mockImplementation(() => {
        throw new Error("Invalid workflow ID");
      });

      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/_tasks/upload-status/"),
        env,
      );

      // This will be a 404 from the router, not our handler
      expect(response.status).toBe(404);
    });

    it("should return 400 when workflow is not found", async () => {
      mockWorkflowGet.mockImplementation(() => {
        throw new Error("Workflow not found");
      });

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
        new Request("https://api.ucdjs.dev/_tasks/upload-status/manifest-upload-16.0.0-1234567890"),
        env,
      );

      await expectApiError(response, {
        status: 502,
      });
    });

    it("should handle completed workflow with output", async () => {
      mockInstanceStatus.mockResolvedValue({
        status: "complete",
        output: {
          success: true,
          version: "16.0.0",
          filesUploaded: 10,
          duration: 5000,
          workflowId: "manifest-upload-16.0.0-1234567890",
        },
        error: undefined,
      });

      mockWorkflowGet.mockReturnValue({
        status: mockInstanceStatus,
      });

      const { response, json } = await executeRequest(
        new Request("https://api.ucdjs.dev/_tasks/upload-status/manifest-upload-16.0.0-1234567890"),
        env,
      );

      expectSuccess(response);
      const data = await json();
      expect(data).toMatchObject({
        workflowId: "manifest-upload-16.0.0-1234567890",
        status: "complete",
        output: {
          success: true,
          version: "16.0.0",
          filesUploaded: 10,
        },
      });
    });

    it("should handle errored workflow", async () => {
      mockInstanceStatus.mockResolvedValue({
        status: "errored",
        output: undefined,
        error: "Failed to upload files: network error",
      });

      mockWorkflowGet.mockReturnValue({
        status: mockInstanceStatus,
      });

      const { response, json } = await executeRequest(
        new Request("https://api.ucdjs.dev/_tasks/upload-status/manifest-upload-16.0.0-1234567890"),
        env,
      );

      expectSuccess(response);
      const data = await json();
      expect(data).toMatchObject({
        workflowId: "manifest-upload-16.0.0-1234567890",
        status: "errored",
        error: "Failed to upload files: network error",
      });
    });
  });
});

import { describe, expect, it } from "vitest";
import { makeManifestUploadId, isValidWorkflowInstanceId, buildR2Key, MAX_TAR_SIZE_BYTES } from "../src/tasks";

describe("tasks module", () => {
  it("makeManifestUploadId normalizes version and uses provided clock", () => {
    const id = makeManifestUploadId("16.0.1", () => 1234);
    expect(id).toBe("manifest-upload-16-0-1-1234");
  });

  it("isValidWorkflowInstanceId enforces pattern and length", () => {
    expect(isValidWorkflowInstanceId("ok_id-1")).toBe(true);
    expect(isValidWorkflowInstanceId("-bad")).toBe(false);
    expect(isValidWorkflowInstanceId("a".repeat(101))).toBe(false);
  });

  it("buildR2Key produces expected key and MAX_TAR_SIZE_BYTES is set", () => {
    expect(buildR2Key("16.0.0", "wf")).toBe("manifest-tars/16.0.0/wf.tar");
    expect(MAX_TAR_SIZE_BYTES).toBeGreaterThan(0);
  });
});

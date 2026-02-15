// Maximum TAR file size (10MB)
export const MAX_TAR_SIZE_BYTES = 10 * 1024 * 1024;

export const MAX_WORKFLOW_INSTANCE_ID_LENGTH = 100;
export const ALLOWED_STRING_ID_PATTERN = "^\\w[\\w-]*$";
const ALLOWED_WORKFLOW_INSTANCE_ID_REGEX = new RegExp(ALLOWED_STRING_ID_PATTERN);

export function makeManifestUploadId(version: string, now: () => number = Date.now) {
  const normalizedVersion = version.replace(/\./g, "-");
  return `manifest-upload-${normalizedVersion}-${now()}`;
}

export function isValidWorkflowInstanceId(id: string) {
  return id.length <= MAX_WORKFLOW_INSTANCE_ID_LENGTH && ALLOWED_WORKFLOW_INSTANCE_ID_REGEX.test(id);
}

export function buildR2Key(version: string, workflowId: string) {
  return `manifest-tars/${version}/${workflowId}.tar`;
}

export function makeManifestUploadId(version: string, now: () => number = Date.now) {
  const normalizedVersion = version.replace(/\./g, "-");
  return `manifest-upload-${normalizedVersion}-${now()}`;
}

import { UNICODE_DRAFT_VERSION, UNICODE_VERSION_METADATA } from "@unicode-utils/core";

export function isValidUnicodeVersion(version: string): boolean {
  return UNICODE_VERSION_METADATA.some((v) => v.version === version) || version === UNICODE_DRAFT_VERSION;
}

export function getLatestStableUnicodeVersion(): string | undefined {
  return UNICODE_VERSION_METADATA.find((v) => v.type === "stable")?.version;
}

export function getLatestDraftUnicodeVersion(): string | undefined {
  return UNICODE_DRAFT_VERSION || UNICODE_VERSION_METADATA.find((v) => v.type === "draft")?.version;
}

export function isDraftUnicodeVersion(version: string): boolean {
  return version === UNICODE_DRAFT_VERSION || UNICODE_VERSION_METADATA.some((v) => v.version === version && v.type === "draft");
}

export function isStableUnicodeVersion(version: string): boolean {
  return UNICODE_VERSION_METADATA.some((v) => v.version === version && v.type === "stable");
}

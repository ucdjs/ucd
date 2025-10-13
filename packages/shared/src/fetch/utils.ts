import type {
  ResponseType,
} from "./types";

const HTTP_METHODS_WITH_PAYLOADS = new Set([
  "PATCH",
  "POST",
  "PUT",
  "DELETE",
]);

export function isPayloadMethod(method?: string): boolean {
  return HTTP_METHODS_WITH_PAYLOADS.has(method?.toUpperCase() || "");
}

export function isJSONSerializable(value: any): boolean {
  if (value === undefined) {
    return false;
  }

  const t = typeof value;
  if (t === "string" || t === "number" || t === "boolean" || t === null) {
    return true;
  }

  if (t !== "object") {
    return false; // bigint, function, symbol, undefined
  }

  if (Array.isArray(value)) {
    return true;
  }

  if (value.buffer) {
    return false;
  }

  // `FormData` and `URLSearchParams` should't have a `toJSON` method,
  // but Bun adds it, which is non-standard.
  if (value instanceof FormData || value instanceof URLSearchParams) {
    return false;
  }

  return (
    (value.constructor && value.constructor.name === "Object")
    || typeof value.toJSON === "function"
  );
}

const TEXT_TYPES = new Set([
  "image/svg",
  "application/xml",
  "application/xhtml",
  "application/html",
]);

const JSON_RE = /^application\/(?:[\w!#$%&*.^`~-]*\+)?json(?:;.+)?$/i;

// This provides reasonable defaults for the correct parser based on Content-Type header.
export function detectResponseType(_contentType = ""): ResponseType {
  if (!_contentType) {
    return "json";
  }

  // Value might look like: `application/json; charset=utf-8`
  const contentType = _contentType.split(";").shift() || "";

  if (JSON_RE.test(contentType)) {
    return "json";
  }

  // TODO
  // if (contentType === 'application/octet-stream') {
  //   return 'stream'
  // }

  // SSE
  // https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#sending_events_from_the_server
  if (contentType === "text/event-stream") {
    return "stream";
  }

  if (TEXT_TYPES.has(contentType) || contentType.startsWith("text/")) {
    return "text";
  }

  return "blob";
}

const HEADER_FILE_VERSION_RE = /\d{1,3}\.\d{1,3}\.\d{1,3}\.txt$/;
const textEncoder = new TextEncoder();
const HEX_CHARS = "0123456789abcdef";
const HEX_TABLE: string[] = [];

for (let i = 0; i < 256; i++) {
  HEX_TABLE[i] = HEX_CHARS[i >> 4]! + HEX_CHARS[i & 0xF]!;
}

function isHeaderLine(line: string): boolean {
  const lower = line.toLowerCase();
  return (
    lower.includes("date:")
    || line.includes("©")
    || lower.includes("unicode®")
    || lower.includes("unicode, inc")
    || HEADER_FILE_VERSION_RE.test(line)
  );
}

function uint8ArrayToHex(bytes: Uint8Array): string {
  let result = "";
  for (let i = 0; i < bytes.length; i++) {
    result += HEX_TABLE[bytes[i]!];
  }
  return result;
}

function normalizeBytes(content: Uint8Array | ArrayBuffer): Uint8Array {
  return content instanceof Uint8Array ? content : new Uint8Array(content);
}

export function stripUnicodeHeader(content: string): string {
  const lines = content.split("\n");
  let headerEndIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line == null) {
      continue;
    }

    const trimmedLine = line.trim();

    if (trimmedLine === "" || trimmedLine === "#") {
      continue;
    }

    if (trimmedLine.startsWith("#") && isHeaderLine(trimmedLine)) {
      headerEndIndex = i + 1;
      continue;
    }

    break;
  }

  if (headerEndIndex > 0) {
    while (headerEndIndex < lines.length && lines[headerEndIndex]?.trim() === "") {
      headerEndIndex++;
    }

    return lines.slice(headerEndIndex).join("\n");
  }

  return content;
}

export async function computeUnicodeBytesHash(content: Uint8Array | ArrayBuffer): Promise<string> {
  const data = normalizeBytes(content);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data as Uint8Array<ArrayBuffer>);
  return `sha256:${uint8ArrayToHex(new Uint8Array(hashBuffer))}`;
}

export async function computeUnicodeTextHash(content: string): Promise<string> {
  return computeUnicodeBytesHash(textEncoder.encode(content));
}

export async function computeUnicodeTextHashWithoutHeader(content: string): Promise<string> {
  return computeUnicodeTextHash(stripUnicodeHeader(content));
}

export function getUnicodeBytesSize(content: Uint8Array | ArrayBuffer): number {
  return normalizeBytes(content).byteLength;
}

export function getUnicodeTextSize(content: string): number {
  return textEncoder.encode(content).length;
}

export async function computeUnicodeFileHash(content: string | Uint8Array): Promise<string> {
  return typeof content === "string"
    ? computeUnicodeTextHash(content)
    : computeUnicodeBytesHash(content);
}

export async function computeUnicodeFileHashWithoutHeader(content: string): Promise<string> {
  return computeUnicodeTextHashWithoutHeader(content);
}

export function getUnicodeFileSize(content: string): number {
  return getUnicodeTextSize(content);
}

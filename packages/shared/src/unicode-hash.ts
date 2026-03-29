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

export async function computeUnicodeFileHash(content: string | Uint8Array): Promise<string> {
  const data = typeof content === "string" ? textEncoder.encode(content) : content;
  const hashBuffer = await crypto.subtle.digest("SHA-256", data as Uint8Array<ArrayBuffer>);
  return `sha256:${uint8ArrayToHex(new Uint8Array(hashBuffer))}`;
}

export async function computeUnicodeFileHashWithoutHeader(content: string): Promise<string> {
  return computeUnicodeFileHash(stripUnicodeHeader(content));
}

export function getUnicodeFileSize(content: string): number {
  return textEncoder.encode(content).length;
}

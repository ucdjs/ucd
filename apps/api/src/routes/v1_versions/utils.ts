import type { HonoEnv } from "#types";
import { resolveUCDVersion } from "@unicode-utils/core";

const SCRIPT_LINE_RE = /^([0-9A-F]+)(?:\.\.([0-9A-F]+))?\s*;\s*(\w+)/;

export async function calculateStatistics(
  bucket: NonNullable<HonoEnv["Bindings"]["UCD_BUCKET"]>,
  version: string,
): Promise<{ totalCharacters: number; newCharacters: number; totalBlocks: number; newBlocks: number; totalScripts: number; newScripts: number } | null> {
  try {
    const mappedVersion = resolveUCDVersion(version);
    const ucdPrefix = `manifest/${mappedVersion}/ucd/`;

    // Try to get UnicodeData.txt
    const unicodeDataKey = `${ucdPrefix}UnicodeData.txt`;
    const unicodeDataObj = await bucket.get(unicodeDataKey);
    if (!unicodeDataObj) return null;

    const unicodeDataText = await unicodeDataObj.text();
    const lines = unicodeDataText.split("\n").filter((line) => line.trim() && !line.startsWith("#"));
    const totalCharacters = lines.length;

    // Try to get Blocks.txt
    const blocksKey = `${ucdPrefix}Blocks.txt`;
    const blocksObj = await bucket.get(blocksKey);
    let totalBlocks = 0;
    if (blocksObj) {
      const blocksText = await blocksObj.text();
      const blockLines = blocksText.split("\n").filter((line) => line.trim() && !line.startsWith("#"));
      totalBlocks = blockLines.length;
    }

    // Try to get Scripts.txt
    const scriptsKey = `${ucdPrefix}Scripts.txt`;
    const scriptsObj = await bucket.get(scriptsKey);
    let totalScripts = 0;
    if (scriptsObj) {
      const scriptsText = await scriptsObj.text();
      const scriptLines = scriptsText.split("\n").filter((line) => line.trim() && !line.startsWith("#"));
      const uniqueScripts = new Set<string>();
      for (const line of scriptLines) {
        const match = line.match(SCRIPT_LINE_RE);
        if (match) {
          uniqueScripts.add(match[3]!);
        }
      }
      totalScripts = uniqueScripts.size;
    }

    // Calculate new characters/blocks/scripts by comparing with previous version
    // For now, we'll return 0 for new counts as calculating them requires comparing with previous version
    // This can be enhanced later to fetch previous version data
    return {
      totalCharacters,
      newCharacters: 0,
      totalBlocks,
      newBlocks: 0,
      totalScripts,
      newScripts: 0,
    };
  } catch {
    return null;
  }
}

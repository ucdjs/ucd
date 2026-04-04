import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { RawDataFile } from "@unicode-utils/core";
import { MockLanguageModelV3 } from "ai/test";
import { describe, expect, it } from "vitest";
import { generateFields } from "../../src/fields/generate";

const ROOT_UCD_FILES_PATH = fileURLToPath(new URL("../../../../test/ucd-files", import.meta.url));

describe("generateFields", () => {
  it("should return null on model error", async () => {
    const result = await generateFields({
      datafile: new RawDataFile("# TEST"),
      model: new MockLanguageModelV3({
        doGenerate: async () => {
          throw new Error("model error");
        },
      }),
    });

    expect(result).toBeNull();
  });

  it("should return an empty array when no fields are detected", async () => {
    const result = await generateFields({
      datafile: new RawDataFile("# No fields here"),
      model: new MockLanguageModelV3({
        doGenerate: async () => ({
          finishReason: { raw: undefined, unified: "stop" },
          usage: {
            inputTokens: { total: 100, noCache: 100, cacheRead: undefined, cacheWrite: undefined },
            outputTokens: { total: 5, text: 5, reasoning: undefined },
          },
          warnings: [],
          content: [{ type: "text", text: JSON.stringify({ fields: [] }) }],
        }),
      }),
    });

    expect(result).toEqual([]);
  });

  it("should correctly parse Arabic Shaping file heading and return fields", async () => {
    const arabicShapingContent = await readFile(
      path.join(ROOT_UCD_FILES_PATH, "./v16/ArabicShaping.txt"),
      "utf-8",
    );

    const result = await generateFields({
      datafile: new RawDataFile(arabicShapingContent),
      model: new MockLanguageModelV3({
        doGenerate: async () => ({
          finishReason: { raw: undefined, unified: "stop" },
          usage: {
            inputTokens: { total: 5000, noCache: 5000, cacheRead: undefined, cacheWrite: undefined },
            outputTokens: { total: 20, text: 20, reasoning: undefined },
          },
          warnings: [],
          content: [
            {
              type: "text",
              text: JSON.stringify({
                fields: [
                  { name: "code_point", type: "string", description: "The code point of a character, in hexadecimal form" },
                  { name: "name", type: "string", description: "A short schematic name for the character" },
                  { name: "joining_type", type: "string", description: "The joining type of the character" },
                  { name: "joining_group", type: "string", description: "The joining group of the character" },
                ],
              }),
            },
          ],
        }),
      }),
    });

    expect(result).toEqual([
      { name: "code_point", type: "string", description: "The code point of a character, in hexadecimal form" },
      { name: "name", type: "string", description: "A short schematic name for the character" },
      { name: "joining_type", type: "string", description: "The joining type of the character" },
      { name: "joining_group", type: "string", description: "The joining group of the character" },
    ]);
  });
});

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { RawDataFile } from "@luxass/unicode-utils-old";
import { MockLanguageModelV3 } from "ai/test";
import { describe, expect, it } from "vitest";
import { generateFields } from "../src/fields";

// TODO: make this a vitest global
const ROOT_UCD_FILES_PATH = fileURLToPath(new URL("../../../test/ucd-files", import.meta.url));

describe("generateFields", () => {
  it("should return null when datafile has no heading", async () => {
    const result = await generateFields({
      datafile: new RawDataFile("TEST", "TEST"),
      model: new MockLanguageModelV3({
        doGenerate: async () => ({
          finishReason: { raw: undefined, unified: "stop" },
          usage: {
            inputTokens: {
              total: 5000,
              noCache: 5000,
              cacheRead: undefined,
              cacheWrite: undefined,
            },
            outputTokens: {
              total: 20,
              text: 20,
              reasoning: undefined,
            },
          },
          warnings: [],
          content: [{ type: "text", text: `{"fields": []}` }],
        }),
      }),
    });

    expect(result).toBeNull();
  });

  it("should return null when neither apiKey nor model is provided", async () => {
    const result = await generateFields({
      datafile: new RawDataFile("# TEST", "TEST"),
    });

    expect(result).toBeNull();
  });

  it("should correctly parse Arabic Shaping file heading and return fields", async () => {
    const arabicShapingContent = await readFile(path.join(ROOT_UCD_FILES_PATH, "./v16/ArabicShaping.txt"), "utf-8");

    const result = await generateFields({
      datafile: new RawDataFile(arabicShapingContent, "ArabicShaping"),
      model: new MockLanguageModelV3({
        doGenerate: async () => ({
          finishReason: { raw: undefined, unified: "stop" },
          usage: {
            inputTokens: {
              total: 5000,
              noCache: 5000,
              cacheRead: undefined,
              cacheWrite: undefined,
            },
            outputTokens: {
              total: 20,
              text: 20,
              reasoning: undefined,
            },
          },
          warnings: [],
          content: [
            {
              type: "text",
              text: `{
                       "fields": [
                         {
                           "name": "code_point",
                           "type": "string",
                           "description": "The code point of a character, in hexadecimal form"
                         },
                         {
                           "name": "name",
                           "type": "string",
                           "description": "A short schematic name for the character"
                         },
                         {
                           "name": "joining_type",
                           "type": "string",
                           "description": "The joining type of the character"
                         },
                         {
                           "name": "joining_group",
                           "type": "string",
                           "description": "The joining group of the character"
                         }
                       ]
                     }`,
            },
          ],
        }),
      }),
    });

    expect(result).toEqual([
      {
        name: "code_point",
        type: "string",
        description: "The code point of a character, in hexadecimal form",
      },
      {
        name: "name",
        type: "string",
        description: "A short schematic name for the character",
      },
      {
        description: "The joining type of the character",
        name: "joining_type",
        type: "string",
      },
      {
        description: "The joining group of the character",
        name: "joining_group",
        type: "string",
      },
    ]);
  });
});

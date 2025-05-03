import type { RawDataFile } from "@luxass/unicode-utils";
import { createOpenAI } from "@ai-sdk/openai";
import { dedent } from "@luxass/utils";
import { generateObject } from "ai";
import { z } from "zod";

const SYSTEM_PROMOT = `
    <system_prompt>
      <role>Expert TypeScript code generator specializing in interfaces and documentation</role>

      <task>
        <input>Text description: {{INPUT}}</input>
        <output>TypeScript interface with comprehensive JSDoc comments</output>
      </task>

      <requirements>
        <field_processing>
          - Extract all relevant fields from text
          - Convert field names to snake_case
          - Preserve original order
        </field_processing>

        <documentation>
          - JSDoc for interface purpose
          - JSDoc for each property
          - Document union types (no enums)
          - Explain constraints and formats
        </documentation>

        <structure>
          - Separate interfaces for reusable structures
          - Inline simple nested structures
          - Create ordered keys array with original casing
        </structure>
      </requirements>

      <format>Single TypeScript code block with complete JSDoc</format>
    </system_prompt>
`;

export interface GenerateFieldsOptions {
  /**
   * The data file to generate fields for.
   */
  datafile: RawDataFile;

  /**
   * The OpenAI API key to use for generating fields.
   */
  apiKey: string;
}

export async function generateFields(options: GenerateFieldsOptions): Promise<string | null> {
  const { datafile, apiKey } = options;

  if (datafile.heading == null) {
    return null;
  }

  if (!apiKey) {
    return null;
  }

  const openai = createOpenAI({
    apiKey,
  });

  try {
    const result = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: z.object({
        code: z.string().describe(
          "A TypeScript code block containing the JSDoc commented interface definition and the corresponding keys array with original casing.",
        ),
      }),
      prompt: SYSTEM_PROMOT.replace("{{INPUT}}", datafile.heading),
    });

    return result.object.code;
  } catch (err) {
    console.error("error generating fields:", err);
    return null;
  }
}

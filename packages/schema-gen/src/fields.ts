import type { RawDataFile } from "@luxass/unicode-utils";
import { createOpenAI } from "@ai-sdk/openai";
import { dedent } from "@luxass/utils";
import { generateObject } from "ai";
import { z } from "zod";

const SYSTEM_PROMOT = dedent`
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
            - Do not declare duplicate fields
          </field_processing>

          <documentation>
            - JSDoc for each property only
            - Document union types with double quotes (no enums)
            - Explain constraints and formats with examples
            - No JSDoc for the main interface
            - Only include examples that are explicitly provided in the source text
            - Do not create or hallucinate additional examples beyond what's given
          </documentation>

          <structure>
            - Use the file name from the first line of the input (ignoring version numbers) as the interface name
            - Single interface named after the input file name without version numbers (e.g., ArabicShaping not ArabicShaping-16.0.0)
            - No additional interfaces or arrays
            - Create ordered keys array named [INTERFACE_NAME]_FIELDS using SCREAMING_SNAKE_CASE
            - Convert the interface name to SCREAMING_SNAKE_CASE by inserting underscores between camelCase words
            - Use double quotes for field names in the keys array
            - No example data or additional declarations
            - Export all variables and interfaces
            - Each field should only be declared once in the interface
          </structure>

          <formatting>
            - Use 2 space indentation
            - Use trailing commas in all multi-line structures
            - Use trailing commas in arrays and interfaces
          </formatting>
        </requirements>

        <format>Single TypeScript code block containing only the interface and fields array, both exported</format>

        <examples>
          - Interface: NamedSequences -> Fields array: NAMED_SEQUENCES_FIELDS
          - Interface: NamedSequencesProv -> Fields array: NAMED_SEQUENCES_PROV_FIELDS
          - Interface: ArabicShaping -> Fields array: ARABIC_SHAPING_FIELDS
        </examples>
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

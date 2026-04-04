import type { RawDataFile } from "@unicode-utils/core";
import type { LanguageModel } from "ai";
import { generateText, Output } from "ai";
import { z } from "zod";

const SYSTEM_PROMPT = `
Extract TypeScript field definitions from a Unicode data file header.

## Field naming
- Use snake_case for all field names.
- Extract the REAL name from patterns like "# Field 0: Code_Point" → "code_point". Never use "field_0", "field_1", etc.

## Types
Valid TypeScript only: string, number, boolean, string[], number[], Array<string>, Array<number>, Record<string, string>, Record<string, number>, Record<string, unknown>, unknown.
- String literal unions: each value quoted with pipe — "\"R\" | \"L\" | \"D\""
- Angle-bracket values like <none> → remove brackets and quote: "\"none\""
- Never use: union, object, array, map, list, none (unquoted)

## Output
Return { "fields": [] } when no fields are detectable. Only include fields you can confidently identify.

## Example
Input:
# Field 0: Code_Point
# Field 1: Name
# Field 2: Joining_Type (R = Right_Joining, L = Left_Joining, D = Dual_Joining, C = Join_Causing, U = Non_Joining, T = Transparent)
# Field 3: Joining_Group

Output:
{
  "fields": [
    { "name": "code_point", "type": "string", "description": "Unicode code point in hexadecimal" },
    { "name": "name", "type": "string", "description": "Schematic name for the character" },
    { "name": "joining_type", "type": "\\"R\\" | \\"L\\" | \\"D\\" | \\"C\\" | \\"U\\" | \\"T\\"", "description": "Joining type (R=Right, L=Left, D=Dual, C=Join_Causing, U=Non_Joining, T=Transparent)" },
    { "name": "joining_group", "type": "string", "description": "Joining group based on character names" }
  ]
}
`.trim();

export interface GenerateFieldsOptions {
  /**
   * The parsed UCD data file to extract fields from.
   */
  datafile: RawDataFile;

  /**
   * The language model to use for field extraction.
   */
  model: LanguageModel;
}

// eslint-disable-next-line ts/explicit-function-return-type
export async function generateFields(options: GenerateFieldsOptions) {
  const { datafile, model } = options;

  try {
    const result = await generateText({
      model,
      system: SYSTEM_PROMPT,
      prompt: datafile.heading,
      output: Output.object({
        schema: z.object({
          fields: z.array(z.object({
            name: z.string(),
            type: z.string(),
            description: z.string(),
          })),
        }),
      }),
    });

    return result.output.fields;
  } catch (err) {
    console.error("error generating fields:", err);
    return null;
  }
}

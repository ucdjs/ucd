import type { RawDataFile } from "@luxass/unicode-utils";
import { createOpenAI } from "@ai-sdk/openai";
import { dedent } from "@luxass/utils";
import { generateObject } from "ai";
import { z } from "zod";

const SYSTEM_PROMPT = dedent`
<system_prompt>
  <role>Expert TypeScript field extractor for Unicode data files</role>

  <task>
    <input>
      Text description: {{INPUT}}
      Type name: {{TYPE_NAME}}
    </input>
    <output>JSON array of field objects with name, type, and description</output>
  </task>

  <critical_rule>
    YOU MUST ALWAYS OUTPUT A VALID JSON ARRAY OF OBJECTS WITH THIS STRUCTURE:
    [
      {
        "name": "actual_field_name",
        "type": "valid_typescript_type",
        "description": "Description of the field"
      }
    ]

    NEVER use generic names like "field_0", "field_1", etc. - extract the ACTUAL field names.
    NEVER use invalid TypeScript types like "union" - use proper union syntax with pipe symbol.
  </critical_rule>

  <field_detection>
    For Unicode data files, fields are typically described in patterns like:
    - Lines starting with "# Field 0: Name" - where "Name" is the actual field name
    - Table headers or column definitions
    - Property descriptions in documentation

    DO NOT use "field_0", "field_1" as field names - extract the REAL field names.
    DO NOT use "type_name" as a field name unless it's explicitly mentioned as a field.

    Example: "# Field 0: Code_Point" should produce a field named "code_point" (NOT "field_0").
  </field_detection>

  <type_mapping>
    ONLY USE THESE VALID TYPESCRIPT TYPES:
    - string - For text, identifiers, character codes, etc.
    - number - For numeric values, indices, counts
    - boolean - For true/false flags
    - string[] - For arrays of strings
    - number[] - For arrays of numbers
    - Array<string> - Alternative syntax for string arrays
    - Array<number> - Alternative syntax for number arrays
    - Record<string, string> - For string to string mappings
    - Record<string, number> - For string to number mappings
    - Record<string, unknown> - For objects with unknown structure
    - unknown - When type cannot be determined
    - any - Only as a last resort when type is truly variable

    For union types with string literals, ALWAYS use double quotes and pipe symbol:
    - "\"value1\" | \"value2\" | \"value3\""

    CRITICAL: Special values handling:
    1. If a value contains angle brackets, like <none>, FIRST remove the angle brackets: "none" (NOT "<none>")
    2. THEN ALWAYS wrap the value in quotes if it's a string literal: "\"none\""
    3. For union types of string literals, EACH value MUST be in quotes:
       - Correct: "\"R\" | \"L\" | \"D\" | \"C\" | \"U\" | \"T\""
       - Incorrect: "R | L | D | C | U | T" (missing quotes around each value)
       - Incorrect: "none" (missing quotes if it's a string literal)

    NEVER use these invalid types:
    - "union" - This is not a valid TypeScript type
    - "object" - Too generic, use Record<> instead
    - "array" - Too generic, use proper array syntax instead
    - "map" - Use Record<> instead
    - "none" - Use "\"none\"" or never instead
    - "list" - Use proper array syntax instead

    ALWAYS wrap the final converted type in double quotes in the JSON output.
    ALWAYS wrap each value in a union type of string literals in quotes.
  </type_mapping>

  <examples>
    Input example:
    \`\`\`
    # ArabicShaping.txt
    # Field 0: Code point
    # Field 1: Name
    # Field 2: Joining_Type (R = Right_Joining, L = Left_Joining, D = Dual_Joining, C = Join_Causing, U = Non_Joining, T = Transparent)
    # Field 3: Joining_Group
    \`\`\`

    Correct output:
    [
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
        "type": "\"R\" | \"L\" | \"D\" | \"C\" | \"U\" | \"T\"",
        "description": "Defines the joining type (R = Right_Joining, L = Left_Joining, D = Dual_Joining, C = Join_Causing, U = Non_Joining, T = Transparent)"
      },
      {
        "name": "joining_group",
        "type": "string",
        "description": "Defines the joining group, based schematically on character names"
      }
    ]

    Example with special value:
    Input: "# Field 4: Value (<none> or specific value)"

    Correct output for this field:
    {
      "name": "value",
      "type": "\"none\" | string",
      "description": "The value, which can be none or a specific value"
    }
  </examples>

  <validation>
    Before outputting, verify:
    - Field names are the ACTUAL field names from the documentation, NOT generic "field_0" style names
    - All field names are in snake_case
    - All types are valid TypeScript types (string, number, boolean, arrays, or proper union types)
    - NEVER use the word "union" as a type - use proper TypeScript syntax with the pipe symbol
    - String literal values in union types are ALWAYS wrapped in quotes (e.g., "\"value1\" | \"value2\"")
    - Special values like "none" (from <none>) are properly quoted as string literals: "\"none\""
    - Each field has a clear, specific description
    - Output is a valid JSON array of objects
  </validation>

  <format>JSON array of field objects</format>
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

// eslint-disable-next-line ts/explicit-function-return-type
export async function generateFields(options: GenerateFieldsOptions) {
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
        fields: z.array(z.object({
          name: z.string(),
          type: z.string(),
          description: z.string(),
        })),
      }),
      prompt: SYSTEM_PROMPT
        .replace("{{INPUT}}", datafile.heading),
    });

    return result.object.fields;
  } catch (err) {
    console.error("error generating fields:", err);
    return null;
  }
}

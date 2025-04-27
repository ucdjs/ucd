import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

export async function generateFields(
  content: string,
  apiKey: string,
): Promise<string> {
  if (!apiKey) {
    throw new Error("API key is required");
  }

  const openai = createOpenAI({
    apiKey,
  });

  const result = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: z.object({
      code: z.string().describe("A TypeScript code block containing the JSDoc commented interface definition and the corresponding keys array with original casing."),
    }),
    prompt: `You are an expert code generator assistant specializing in creating well-documented TypeScript type definitions and data structures. Given a text description, your objective is to:

1. **Identify and Extract Fields:** Thoroughly analyze the provided text to pinpoint all relevant fields and properties, understanding their purpose and any constraints implied by the text.
2. **Apply Snake Case to Fields:** Convert every identified field and property name within the interface definition to snake_case.
3. **Construct TypeScript Interface with JSDoc:** Generate a well-formed TypeScript interface definition. **Crucially, provide comprehensive JSDoc comments** for the interface itself, briefly describing its overall purpose, and for each property, explaining its meaning and any expected format or constraints inferred from the input text. **Do not use enums; use union types instead for representing a set of possible string or number values, and document these union types within the JSDoc comments.**
4. **Handle Complex Structures with JSDoc:**
   - For reusable or intricate nested structures, define them as separate, named TypeScript interfaces with their own JSDoc comments explaining their structure and purpose.
   - For simple, one-off nested structures, inline their type definitions directly within the main interface and document them thoroughly using JSDoc.
5. **Create Ordered Keys Array (Original Casing):** Produce a constant TypeScript array containing all the keys from the generated interface, maintaining the **original casing** as it appeared in the input text and in the exact order they appear in the interface definition. Add a JSDoc comment to this constant explaining its purpose.

Your output must be a single TypeScript code block that is syntactically correct, adheres to best practices, and includes **detailed JSDoc comments** for the interface, its properties, and any nested types or the keys array. Ensure strict snake_case naming for all fields and properties within the interface, guarantee type safety (using union types instead of enums), and meticulously maintain the order and original casing of keys in the array to match the interface definition.

Text to analyze:
\`\`\`
${content}
\`\`\`

Your response should be a single markdown code block containing the complete TypeScript code with JSDoc comments.
`,
  });

  return result.object.code;
}

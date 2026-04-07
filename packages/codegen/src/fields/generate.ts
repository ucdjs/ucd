import type { RawDataFile } from "@unicode-utils/core";
import type { LanguageModel } from "ai";
import { createDebugger } from "@ucdjs-internal/shared";
import { generateText, Output, stepCountIs, tool } from "ai";
import { z } from "zod";

const debug = createDebugger("ucdjs:codegen:fields:generate");

const SYSTEM_PROMPT = `
Extract TypeScript field definitions from a Unicode data file header.

## Field naming
- Use snake_case for all field names.
- Extract the REAL name from patterns like "# Field 0: Code_Point" → "code_point". Never use "field_0", "field_1", etc.
- Preserve the exact order fields appear in the file. Never reorder them.
- Strip angle brackets from format tokens: "<codepoint(s)>" → "codepoints", "<property>" → "property".
- Remove parentheses and their contents from names: "codepoint(s)" → "codepoints".
- The result must be a valid snake_case TypeScript identifier — no parentheses, brackets, spaces, or special characters.

## Types
Valid TypeScript only: string, number, boolean, string[], number[], Array<string>, Array<number>, Record<string, string>, Record<string, number>, Record<string, unknown>, unknown.
- String literal unions: each value quoted with pipe separator, values in the exact order they appear in the header — "\\"R\\" | \\"L\\" | \\"D\\""
- Angle-bracket values like <none> → remove brackets and quote: "\\"none\\""
- Never use: union, object, array, map, list, none (unquoted)

## Descriptions
- Format: "<FieldName>: <one sentence explanation>".
- Use the exact field name as written in the header (not snake_case) at the start.
- Copy wording from the header comments when available. Do not paraphrase.
- Keep descriptions identical across regenerations — do not vary phrasing.

## Output rules
- Prefer explicit field declarations when present:
  - "Field N: Name" or "Fields: Name1; Name2; ..."
  - Format lines like "# <field1> ; <field2> # <comments>" — angle-bracket tokens are field names (strip brackets)
  - In format lines, tokens after # are comment fields — include them.
- When no explicit declarations exist, reason about the file structure from the header context (file name, description, format hints) and infer the most likely fields.
- Only return { "fields": [] } when there is genuinely no information to derive any fields from.

## Tools

A 'fetch_unicode_report' tool is available — but ONLY as a last resort.
It fetches unicode.org/reports/ URLs only (not /Public/ data files).

BEFORE using the tool, check: does the header contain explicit field declarations ('Field N: Name', 'Fields: A; B; C', or a format line like '# <field1> ; <field2>')? If yes — output the fields directly. Do NOT call the tool.

Only call the tool when ALL of the following are true:
1. The header contains NO explicit field declarations (no 'Field N: Name', no format line with angle-bracket tokens).
2. You have NOT already fetched that URL in this session.

Do NOT rely on training data knowledge to infer field names or types. If the header lacks explicit declarations, you MUST use the tool — do not guess from what you already know about Unicode files.

When the header has a '# Property: <name>' line but no format line and no field list, fetch the most specific URL referenced in the header (e.g. a tr24 link). If no specific URL is present, fetch 'https://www.unicode.org/reports/tr44/'.

Each URL may only be fetched ONCE. Do not retry the same URL.
Only fetch URLs that are explicitly present in the header, or 'https://www.unicode.org/reports/tr44/' as a last resort.

Example — Property-only header (MUST use tool):
Input:
# Scripts-17.0.0.txt
# For more information, see:
#   UAX #24, Unicode Script Property: https://www.unicode.org/reports/tr24/
# Property: Script
# @missing: 0000..10FFFF; Unknown

Action: call fetch_unicode_report with url='https://www.unicode.org/reports/tr24/' to determine the correct field names and types before outputting.

## Examples

Example 1 — Field N pattern:
Input:
# Field 0: Code_Point
# Field 1: Name
# Field 2: Joining_Type (R = Right_Joining, L = Left_Joining, D = Dual_Joining, C = Join_Causing, U = Non_Joining, T = Transparent)
# Field 3: Joining_Group

Output:
{
  "fields": [
    { "name": "code_point", "type": "string", "description": "Code_Point: Unicode code point in hexadecimal." },
    { "name": "name", "type": "string", "description": "Name: Schematic name for the character." },
    { "name": "joining_type", "type": "\\"R\\" | \\"L\\" | \\"D\\" | \\"C\\" | \\"U\\" | \\"T\\"", "description": "Joining_Type: Joining type (R=Right_Joining, L=Left_Joining, D=Dual_Joining, C=Join_Causing, U=Non_Joining, T=Transparent)." },
    { "name": "joining_group", "type": "string", "description": "Joining_Group: Joining group name based on character names." }
  ]
}

Example 2 — Format line pattern:
Input:
# Format:
# <codepoint(s)> ; <property> # <comments>

Output:
{
  "fields": [
    { "name": "codepoints", "type": "string", "description": "codepoints: One or more Unicode code points in hexadecimal." },
    { "name": "property", "type": "string", "description": "property: The emoji property value." },
    { "name": "comments", "type": "string", "description": "comments: Informational comment." }
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

  /**
   * The file name (basename) used for debug logging.
   */
  fileName?: string;
}

// eslint-disable-next-line ts/explicit-function-return-type
export async function generateFields(options: GenerateFieldsOptions) {
  const { datafile, model, fileName } = options;

  try {
    const fetchedUrls = new Set<string>();
    debug?.("generating fields", { headingLength: datafile.heading.length });
    const result = await generateText({
      model,
      system: SYSTEM_PROMPT,
      prompt: datafile.heading,
      temperature: 0,
      tools: {
        fetch_unicode_report: tool({
          description: "Fetch a Unicode report or specification page from unicode.org",
          inputSchema: z.object({
            // eslint-disable-next-line e18e/prefer-static-regex
            url: z.string().regex(/^https?:\/\/(www\.)?unicode\.org\/reports\/(.*)$/m),
          }),
          execute: async ({ url }) => {
            if (!url.startsWith("http://www.unicode.org/reports") && !url.startsWith("https://www.unicode.org/reports") && !url.startsWith("http://unicode.org/reports") && !url.startsWith("https://unicode.org/reports")) {
              return "Error: Only unicode.org/reports/ URLs are permitted.";
            }

            // Strip hash fragment and normalize versioned filenames (e.g. tr24/tr24-39.html → tr24/)
            // eslint-disable-next-line e18e/prefer-static-regex
            const normalizedUrl = url.split("#")[0]!.replace(/\/tr\d+-\d+\.html$/, "/");
            if (fetchedUrls.has(normalizedUrl)) {
              return "Error: This URL has already been fetched. Do not fetch the same URL twice.";
            }
            fetchedUrls.add(normalizedUrl);

            debug?.("tool executed fetch_unicode_report", { url: normalizedUrl, fileName });

            const res = await fetch(normalizedUrl);
            const html = await res.text();
            const text = html
              .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
              .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
              .replace(/<[^>]+>/g, " ")
              .replace(/&nbsp;/g, " ")
              .replace(/&lt;/g, "<")
              .replace(/&gt;/g, ">")
              .replace(/&amp;/g, "&")
              .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
              .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number.parseInt(dec, 10)))
              .replace(/[ \t]+/g, " ")
              .replace(/\n{3,}/g, "\n\n")
              .trim();
            const MAX_CHARS = 12_000;
            const output = text.length > MAX_CHARS
              ? `${text.slice(0, MAX_CHARS)}\n\n[truncated — content exceeded ${MAX_CHARS} characters]`
              : text;
            debug?.("tool result fetch_unicode_report", { url: normalizedUrl, fileName, content: output });
            return output;
          },
        }),
      },
      stopWhen: stepCountIs(20),
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

    debug?.("fields generated", { count: result.output.fields.length, fields: result.output.fields.map((f) => f.name) });
    return result.output.fields;
  } catch (err) {
    debug?.("error generating fields", { err });
    return null;
  }
}

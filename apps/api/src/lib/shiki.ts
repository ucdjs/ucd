import type { HighlighterCore } from "shiki";
import { createCssVariablesTheme, createHighlighterCore, createJavaScriptRegexEngine, getTokenStyleObject } from "shiki";
import { CodeToTokenTransformStream } from "shiki-stream";
import ucdTMLanguage from "../../../../vscode/syntaxes/ucd.tmLanguage.json";

let highlighterPromise: Promise<HighlighterCore> | null = null;

export const SHIKI_CACHE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const codeTheme = createCssVariablesTheme({
  name: "ucd-code",
  variablePrefix: "--shiki-",
});

export async function getHighlighter(): Promise<HighlighterCore> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighterCore({
      themes: [codeTheme],
      langs: [
        import("shiki/langs/json.mjs"),
        import("shiki/langs/xml.mjs"),
        ucdTMLanguage,
      ],
      engine: createJavaScriptRegexEngine(),
    });
  }
  return highlighterPromise;
}

/**
 * Highlight UCD file content with syntax highlighting
 *
 * @param content - The raw file content
 * @param language - The language identifier (from detectUCDLanguage)
 * @param _filename - The original filename for context
 * @returns Object with HTML content and cache headers
 *
 * @example
 * ```typescript
 * const { html, headers } = await highlightUCDFile(
 *   "0041;LATIN CAPITAL LETTER A;Lu;0;L;;;;;N;;;;;\n",
 *   "ucd-unicodedata",
 *   "UnicodeData.txt"
 * );
 * ```
 */
export async function highlightUCDFile(
  content: string,
  language: string,
  _filename: string,
): Promise<{ html: string; headers: Record<string, string> }> {
  const highlighter = await getHighlighter();

  // Map UCD-specific languages to base languages for now
  // Custom grammars can be added later
  const baseLang = mapUCDToBaseLanguage(language);

  // Check if language is supported
  const langSupported = highlighter.getLoadedLanguages().includes(baseLang);
  const finalLang = langSupported ? baseLang : "txt";

  const html = highlighter.codeToHtml(content, {
    lang: finalLang,
    theme: "ucd-code",
  });

  return {
    html,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": `public, max-age=${SHIKI_CACHE_MAX_AGE}, immutable`,
      "Vary": "Accept-Encoding",
      "X-Shiki-Language": language,
      "X-Shiki-Base-Language": finalLang,
    },
  };
}

export async function highlightUCDFileStream(
  contentStream: ReadableStream,
  language: string,
  _filename: string,
  options?: { signal?: AbortSignal },
): Promise<ReadableStream<Uint8Array>> {
  const highlighter = await getHighlighter();
  const baseLang = mapUCDToBaseLanguage(language);
  const langSupported = highlighter.getLoadedLanguages().includes(baseLang);
  const finalLang = langSupported ? baseLang : "txt";

  const tokenStream = contentStream
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new CodeToTokenTransformStream({
      highlighter,
      lang: finalLang,
      theme: "ucd-code",
      allowRecalls: false,
    }));

  const encoder = new TextEncoder();
  const signal = options?.signal;

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = tokenStream.getReader();
      const handleAbort = () => {
        void reader.cancel(signal?.reason).catch(() => {});
      };

      if (signal?.aborted) {
        handleAbort();
        controller.close();
        reader.releaseLock();
        return;
      }

      signal?.addEventListener("abort", handleAbort, { once: true });

      controller.enqueue(encoder.encode("<pre class=\"shiki shiki-stream\"><code>"));

      try {
        while (true) {
          if (signal?.aborted) {
            break;
          }

          const { done, value } = await reader.read();
          if (done) {
            break;
          }

          if ("recall" in value) {
            continue;
          }

          const styleObject = value.htmlStyle || getTokenStyleObject(value);
          const style = Object.entries(styleObject)
            .map(([key, cssValue]) => `${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}:${cssValue}`)
            .join(";");
          const content = value.content
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;");
          const html = style.length > 0
            ? `<span style="${style}">${content}</span>`
            : content;

          controller.enqueue(encoder.encode(html));
        }

        if (!signal?.aborted) {
          controller.enqueue(encoder.encode("</code></pre>"));
          controller.close();
        }
      } catch (error) {
        if (!signal?.aborted) {
          controller.error(error);
        }
      } finally {
        signal?.removeEventListener("abort", handleAbort);
        reader.releaseLock();
      }
    },
    async cancel(reason) {
      await tokenStream.cancel(reason);
    },
  });
}

/**
 * Map UCD-specific language identifiers to base Shiki languages
 *
 * @param ucdLang - The UCD language identifier
 * @returns The base Shiki language to use
 */
export function mapUCDToBaseLanguage(ucdLang: string): string {
  switch (ucdLang) {
    case "xml":
      return "xml";
    case "json":
      return "json";
    case "csv":
      return "csv";
    // All UCD-specific file types use the custom UCD grammar
    case "ucd-unicodedata":
    case "ucd-blocks":
    case "ucd-scripts":
    case "ucd-properties":
    case "ucd-ranges":
    case "ucd-emoji":
    case "ucd-emoji-sequences":
    case "ucd-emoji-zwj":
    case "ucd-named-sequences":
    case "ucd-normalization":
    case "ucd-confusables":
    case "ucd-casefolding":
    case "ucd-bidi":
    case "ucd-grapheme":
    case "ucd-linebreak":
    case "ucd-wordbreak":
    case "ucd-sentencebreak":
    case "ucd-eastasian":
    case "ucd-vertical":
    case "ucd-composition":
    case "ucd-arabic-shaping":
      return "ucd";
    case "txt":
    default:
      return "txt";
  }
}

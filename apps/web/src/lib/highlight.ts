import type { ShikiTransformer } from "shiki";
import { createJavaScriptRegexEngine } from "shiki";
import { createCssVariablesTheme, createHighlighterCore } from "shiki/core";
import ucdTMLanguage from "../../../../vscode/syntaxes/ucd.tmLanguage.json";

const MAX_HIGHLIGHT_SIZE = 100 * 1024;

const codeTheme = createCssVariablesTheme({
  name: "ucd-code",
  variablePrefix: "--shiki-",
});

const highlighterPromise = createHighlighterCore({
  themes: [codeTheme],
  langs: [
    import("shiki/langs/xml.mjs"),
    import("shiki/langs/html.mjs"),
    import("shiki/langs/json.mjs"),
    ucdTMLanguage,
  ],
  engine: createJavaScriptRegexEngine(),
});

const EXTENSION_LANGUAGE_MAP: Record<string, string> = {
  xml: "xml",
  html: "html",
  htm: "html",
  json: "json",
};

export function getShikiLanguage(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  return EXTENSION_LANGUAGE_MAP[ext] || "ucd";
}

export function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function wrapLinesAsHtml(text: string): string {
  const lines = text.split("\n");
  const escapedLines = lines.map(
    (line) => `<span class="line">${escapeHtml(line)}</span>`,
  );
  return `<pre><code>${escapedLines.join("\n")}</code></pre>`;
}

const lineTransformer: ShikiTransformer = {
  name: "ucd:line-class",
  line(hast) {
    this.addClassToHast(hast, "line");
  },
};

export async function highlight(code: string, lang: string): Promise<string> {
  if (code.length > MAX_HIGHLIGHT_SIZE) {
    return wrapLinesAsHtml(code);
  }

  try {
    const highlighter = await highlighterPromise;
    return highlighter.codeToHtml(code, {
      lang,
      theme: "ucd-code",
      rootStyle: false,
      transformers: [lineTransformer],
    });
  } catch {
    return wrapLinesAsHtml(code);
  }
}

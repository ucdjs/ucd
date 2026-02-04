import { createHighlighter } from "shiki";

const EXTENSION_MAP: Record<string, string> = {
  // JavaScript/TypeScript
  js: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  ts: "typescript",
  mts: "typescript",
  cts: "typescript",
  jsx: "jsx",
  tsx: "tsx",

  // Web
  html: "html",
  htm: "html",
  css: "css",
  scss: "scss",
  sass: "scss",
  less: "less",

  // Data formats
  json: "json",
  jsonc: "jsonc",
  json5: "jsonc",
  yaml: "yaml",
  yml: "yaml",
  toml: "toml",
  xml: "xml",
  svg: "xml",

  // Shell
  sh: "bash",
  bash: "bash",
  zsh: "bash",
  fish: "bash",

  // Docs
  md: "markdown",
  mdx: "markdown",
  markdown: "markdown",

  // Other languages
  py: "python",
  rs: "rust",
  go: "go",
  sql: "sql",
  graphql: "graphql",
  gql: "graphql",
  diff: "diff",
  patch: "diff",
};

const FILENAME_MAP: Record<string, string> = {
  ".gitignore": "bash",
  ".npmignore": "bash",
  ".editorconfig": "toml",
  ".prettierrc": "json",
  ".eslintrc": "json",
  "tsconfig.json": "jsonc",
  "jsconfig.json": "jsonc",
  "package.json": "json",
  "package-lock.json": "json",
  "pnpm-lock.yaml": "yaml",
  "yarn.lock": "yaml",
  "Makefile": "bash",
  "Dockerfile": "bash",
  "LICENSE": "text",
  "CHANGELOG": "markdown",
  "CHANGELOG.md": "markdown",
  "README": "markdown",
  "README.md": "markdown",
  "README.markdown": "markdown",
};

let highlighterPromise: ReturnType<typeof createHighlighter> | null = null;

function getOrCreateHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ["github-light"],
      langs: ["text"],
    });
  }
  return highlighterPromise;
}

export function getLanguageFromPath(filePath: string): string {
  const filename = filePath.split("/").pop() || "";
  if (FILENAME_MAP[filename]) {
    return FILENAME_MAP[filename];
  }

  const ext = filename.split(".").pop()?.toLowerCase() || "";
  return EXTENSION_MAP[ext] || "text";
}

function escapeRawGt(html: string) {
  return html.replace(/>(?=\s*[^<])/g, "&gt;");
}

function wrapLines(html: string) {
  if (html.includes('<span class="line">')) {
    return html.replace(/<\/span>\n<span class="line">/g, "</span><span class=\"line\">");
  }

  const codeMatch = html.match(/<code[^>]*>([\s\S]*)<\/code>/);
  if (!codeMatch?.[1]) return html;

  const codeContent = codeMatch[1];
  const lines = codeContent.split("\n");
  const wrappedLines = lines
    .map((line, index) => {
      if (index === lines.length - 1 && line === "") return null;
      return `<span class="line">${line}</span>`;
    })
    .filter((line): line is string => Boolean(line))
    .join("");

  return html.replace(codeContent, wrappedLines);
}

export async function highlightCode(code: string, language: string): Promise<string> {
  const highlighter = await getOrCreateHighlighter();
  const loadedLanguages = highlighter.getLoadedLanguages();

  let html: string | null = null;

  if (loadedLanguages.includes(language as never)) {
    html = await highlighter.codeToHtml(code, {
      lang: language,
      theme: "github-light",
    });
  } else {
    try {
      await highlighter.loadLanguage(language as never);
      html = await highlighter.codeToHtml(code, {
        lang: language,
        theme: "github-light",
      });
    } catch {
      html = null;
    }
  }

  if (html) {
    return wrapLines(escapeRawGt(html));
  }

  const lines = code.split("\n");
  const wrappedLines = lines
    .map((line) => {
      const escaped = line
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      return `<span class="line">${escaped}</span>`;
    })
    .join("");

  return `<pre class="shiki github-light"><code>${wrappedLines}</code></pre>`;
}

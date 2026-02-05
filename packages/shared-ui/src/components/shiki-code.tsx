import type { BundledLanguage, BundledTheme } from "shiki";
import { cache, memo, use } from "react";
import { createJavaScriptRegexEngine } from "shiki";
import { createHighlighterCore } from "shiki/core";

export interface ShikiCodeProps {
  /**
   * The code to highlight
   */
  code: string;
  /**
   * The language to use for syntax highlighting
   * @default "typescript"
   */
  language?: BundledLanguage;
  /**
   * The theme to use for syntax highlighting
   * @default "github-dark"
   */
  theme?: BundledTheme;
  /**
   * Additional CSS class names
   */
  className?: string;
}

const getHighlighter = cache(async () => {
  return await createHighlighterCore({
    themes: [import("shiki/themes/github-dark.mjs")],
    langs: [
      import("shiki/langs/javascript.mjs"),
      import("shiki/langs/typescript.mjs"),
      import("shiki/langs/json.mjs"),
    ],
    engine: createJavaScriptRegexEngine(),
  });
});

/**
 * A syntax highlighting component powered by Shiki.
 * Renders code to HTML with syntax highlighting.
 *
 * @example
 * ```tsx
 * <ShikiCode code="const x = 1;" language="typescript" />
 * ```
 */
export const ShikiCode = memo<ShikiCodeProps>(({
  code,
  language = "typescript",
  theme = "github-dark",
  className,
}) => {
  const highlighter = use(getHighlighter());

  const html = highlighter.codeToHtml(code, {
    lang: language,
    theme,
  });

  // eslint-disable-next-line react-dom/no-dangerously-set-innerhtml
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
});

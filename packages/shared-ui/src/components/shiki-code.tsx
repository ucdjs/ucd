import type { BundledLanguage, BundledTheme } from "shiki";
import { memo, use, useMemo } from "react";
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

const highlighterPromise = createHighlighterCore({
  themes: [import("shiki/themes/github-dark.mjs")],
  langs: [
    import("shiki/langs/javascript.mjs"),
    import("shiki/langs/typescript.mjs"),
    import("shiki/langs/json.mjs"),
  ],
  engine: createJavaScriptRegexEngine(),
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
  const highlighter = use(highlighterPromise);

  const html = useMemo(() => {
    return highlighter.codeToHtml(code, { lang: language, theme });
  }, [highlighter, code, language, theme]);

  // eslint-disable-next-line react-dom/no-dangerously-set-innerhtml
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
});

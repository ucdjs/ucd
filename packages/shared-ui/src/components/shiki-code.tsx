import type { BundledLanguage, DecorationItem, ShikiTransformer } from "shiki";
import { use, useMemo } from "react";
import { createJavaScriptRegexEngine } from "shiki";
import { createCssVariablesTheme, createHighlighterCore } from "shiki/core";
import ucdTmLanguage from "../../../../vscode/syntaxes/ucd.tmLanguage.json";

export interface ShikiCodeProps {
  /**
   * The code to highlight
   */
  code: string;

  /**
   * The language to use for syntax highlighting
   * @default "typescript"
   */
  language?: BundledLanguage | "ucd";

  /**
   * Additional CSS class names
   */
  className?: string;

  /**
   * Additional CSS class names for the `<pre>` element.
   */
  preClassName?: string;

  /**
   * Additional CSS class names for the `<code>` element.
   */
  codeClassName?: string;

  /**
   * Shiki decorations for inline annotations/highlights.
   */
  decorations?: DecorationItem[];
}

const codeTheme = createCssVariablesTheme({
  name: "ucd-code",
  variablePrefix: "--shiki-",
});

const highlighterPromise = createHighlighterCore({
  themes: [codeTheme],
  langs: [
    import("shiki/langs/javascript.mjs"),
    import("shiki/langs/typescript.mjs"),
    import("shiki/langs/json.mjs"),
    ucdTmLanguage,
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
export function ShikiCode({
  code,
  language = "typescript",
  className,
  preClassName,
  codeClassName,
  decorations,
}: ShikiCodeProps) {
  const highlighter = use(highlighterPromise);
  const rootClassName = className ? `shiki-root ${className}` : "shiki-root";
  const preClasses = ["shiki", "shiki-code", preClassName].filter((value): value is string => Boolean(value));
  const codeClasses = ["shiki-code__code", codeClassName].filter((value): value is string => Boolean(value));

  const html = useMemo(() => {
    const transformers: ShikiTransformer[] = [
      {
        name: "shiki:code-theme",
        pre(hast) {
          this.addClassToHast(hast, preClasses);
          hast.properties ||= {};
          hast.properties["data-language"] = this.options.lang;
        },
        code(hast) {
          this.addClassToHast(hast, codeClasses);
        },
        line(hast, line) {
          this.addClassToHast(hast, "shiki-code__line");
          hast.properties ||= {};
          hast.properties["data-line"] = line;
        },
      },
    ];

    return highlighter.codeToHtml(code, {
      lang: language,
      theme: "ucd-code",
      rootStyle: false,
      transformers,
      decorations,
    });
  }, [code, codeClasses, decorations, highlighter, language, preClasses]);

  // eslint-disable-next-line react-dom/no-dangerously-set-innerhtml
  return <div className={rootClassName} data-shiki-root dangerouslySetInnerHTML={{ __html: html }} />;
}

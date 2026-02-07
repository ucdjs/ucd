import type { BundledLanguage, BundledTheme, DecorationItem, ShikiTransformer } from "shiki";
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
   * Used when `themes` is not provided.
   * @default "github-dark-dimmed"
   */
  theme?: BundledTheme;

  /**
   * Multiple themes for light/dark mode.
   * When provided, `theme` is ignored.
   */
  themes?: {
    light: BundledTheme;
    dark: BundledTheme;
  };

  /**
   * Default color behavior when using multiple themes.
   * @default "light-dark()"
   */
  defaultColor?: "light" | "dark" | "light-dark()" | false;

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

const highlighterPromise = createHighlighterCore({
  themes: [
    import("shiki/themes/github-light.mjs"),
    import("shiki/themes/github-dark-dimmed.mjs"),
  ],
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
  theme,
  themes,
  defaultColor = "light-dark()",
  className,
  preClassName,
  codeClassName,
  decorations,
}) => {
  const highlighter = use(highlighterPromise);
  const rootClassName = className ? `shiki-root ${className}` : "shiki-root";

  const shadcnThemes = useMemo(() => {
    if (themes) {
      return themes;
    }
    if (theme) {
      return null;
    }
    return {
      light: "github-light",
      dark: "github-dark-dimmed",
    } satisfies ShikiCodeProps["themes"];
  }, [theme, themes]);

  const transformers = useMemo<ShikiTransformer[]>(() => {
    const preClasses = ["shiki", "shiki-code"];
    if (preClassName) {
      preClasses.push(preClassName);
    }
    const codeClasses = ["shiki-code__code"];
    if (codeClassName) {
      codeClasses.push(codeClassName);
    }

    return [
      {
        name: "shiki:shadcn",
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
  }, [codeClassName, preClassName]);

  const html = useMemo(() => {
    if (shadcnThemes) {
      return highlighter.codeToHtml(code, {
        lang: language,
        themes: shadcnThemes,
        defaultColor,
        rootStyle: false,
        transformers,
        decorations,
      });
    }

    return highlighter.codeToHtml(code, {
      lang: language,
      theme: theme ?? "github-dark-dimmed",
      rootStyle: false,
      transformers,
      decorations,
    });
  }, [code, decorations, defaultColor, highlighter, language, shadcnThemes, theme, transformers]);

  // eslint-disable-next-line react-dom/no-dangerously-set-innerhtml
  return <div className={rootClassName} data-shiki-root dangerouslySetInnerHTML={{ __html: html }} />;
});

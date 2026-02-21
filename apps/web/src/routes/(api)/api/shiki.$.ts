import { createFileRoute } from "@tanstack/react-router";
import { createJavaScriptRegexEngine } from "shiki";
import { createCssVariablesTheme, createHighlighterCore } from "shiki/core";
import ucdTmLanguage from "../../../../../../vscode/syntaxes/ucd.tmLanguage.json";

const codeTheme = createCssVariablesTheme({
  name: "ucd-code",
  variablePrefix: "--shiki-",
});

const highlighterPromise = createHighlighterCore({
  themes: [codeTheme],
  langs: [
    ucdTmLanguage,
  ],
  engine: createJavaScriptRegexEngine(),
});

export const Route = createFileRoute("/(api)/api/shiki/$")({
  server: {
    handlers: {
      GET: async ({ params, context }) => {
        const { _splat } = params;
        console.error("jsdlfæjsjfsldjk");

        // We should validate the path against, the "real" api file route.
        // so we can ensure that what we "highlight" is actually a file that exists and is accessible.
        if (_splat?.trim() === "") {
          return new Response("Missing file path", { status: 400 });
        }

        const res = await fetch(`${context.apiBaseUrl}/api/v1/files/${_splat}`, {});

        if (!res.ok) {
          if (res.status === 404) {
            return new Response("File not found", { status: 404 });
          }

          return new Response(`Failed to fetch file: ${res.statusText}`, { status: res.status });
        }

        const fileContent = await res.text();

        const highlighter = await highlighterPromise;
        const highlighted = highlighter.codeToHtml(fileContent, { lang: "ucd", theme: codeTheme });

        return new Response(highlighted, {
          headers: {
            "Content-Type": "text/html",
          },
        });
      },
    },
  },
});

import { defineConfig, defineDocs } from "fumadocs-mdx/config";
import rehypeMermaid from "rehype-mermaid";

export default defineConfig({
  mdxOptions: {
    rehypePlugins: (plugins) => [
      [
        rehypeMermaid,
        {
          strategy: "inline-svg",
        },
      ],
      ...plugins,
    ],
  },
});

export const docs = defineDocs({
  dir: "content",
});

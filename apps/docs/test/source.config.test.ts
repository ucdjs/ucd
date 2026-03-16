import rehypeMermaid from "rehype-mermaid";
import { describe, expect, it } from "vitest";
import config, { docs } from "../source.config";

describe("docs source config", () => {
  it("uses rehype-mermaid for build-time Mermaid diagrams", () => {
    expect(docs.dir).toBe("content");
    expect(config.mdxOptions).toEqual({
      rehypePlugins: expect.any(Function),
    });

    if (typeof config.mdxOptions === "function") {
      throw new TypeError("Expected docs MDX options to be an object.");
    }

    const { rehypePlugins } = config.mdxOptions ?? {};

    expect(typeof rehypePlugins).toBe("function");
    if (typeof rehypePlugins !== "function") {
      throw new TypeError("Expected rehypePlugins to be a function.");
    }

    const plugins = rehypePlugins([]);

    expect(plugins).toEqual([
      [
        rehypeMermaid,
        {
          strategy: "inline-svg",
        },
      ],
    ]);
  });
});

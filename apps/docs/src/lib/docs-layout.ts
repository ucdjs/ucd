import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

export function baseOptions(): BaseLayoutProps & {
  sidebar?: {
    tabs?: Array<{
      title: string;
      url: string;
    }>;
  };
} {
  return {
    nav: {
      title: "UCD.js Docs",
      url: "/",
    },
    sidebar: {
      tabs: [
        {
          title: "General",
          url: "/",
        },
        {
          title: "Pipelines",
          url: "/pipelines",
        },
        {
          title: "Architecture",
          url: "/architecture",
        },
        {
          title: "API Reference",
          url: "/api-reference",
        },
        {
          title: "Contributing",
          url: "/contributing",
        },
      ],
    },
  };
}

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
      title: "UCD.js",
    },
    sidebar: {
      tabs: [
        {
          title: "UCD.js",
          url: "/docs/ucdjs",
        },
        {
          title: "Core",
          url: "/docs/core",
        },
        {
          title: "Schemas",
          url: "/docs/schemas",
        },
        {
          title: "Utilities",
          url: "/docs/utilities",
        },
      ],
    },
  };
}

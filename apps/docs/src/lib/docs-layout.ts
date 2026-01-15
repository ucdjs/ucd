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
          title: "UCD.js",
          url: "/ucdjs",
        },
        {
          title: "Core",
          url: "/core",
        },
        {
          title: "Schemas",
          url: "/schemas",
        },
        {
          title: "Utilities",
          url: "/utilities",
        },
      ],
    },
  };
}

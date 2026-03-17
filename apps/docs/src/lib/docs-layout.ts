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
          title: "Packages",
          url: "/packages",
        },
        {
          title: "Contributing",
          url: "/contributing",
        },
      ],
    },
  };
}

export function getSection(path: string | undefined) {
  if (!path) return "general";
  const [dir] = path.split("/", 1);
  if (!dir) return "general";
  return (
    {
      pipelines: "pipelines",
      packages: "packages",
      architecture: "architecture",
      contributing: "contributing",
    }[dir] ?? "general"
  );
}

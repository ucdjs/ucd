import type { MDXComponents } from "mdx/types";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useFumadocsLoader } from "fumadocs-core/source/client";
import browserCollections from "fumadocs-mdx:collections/browser";
import * as TabsComponents from "fumadocs-ui/components/tabs";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/layouts/docs/page";
import defaultMdxComponents from "fumadocs-ui/mdx";
import * as icons from "lucide-react";
import { Suspense } from "react";
import { DocsNotFound } from "@/components/not-found";
import { baseOptions } from "@/lib/docs-layout";
import { source } from "@/lib/docs-loader";

const serverLoader = createServerFn({
  method: "GET",
}).inputValidator((slugs: string[]) => slugs)
  .handler(async ({ data: slugs }) => {
    const page = source.getPage(slugs);
    if (!page) throw notFound();

    return {
      path: page.path,
      pageTree: await source.serializePageTree(source.getPageTree()),
    };
  });

const clientLoader = browserCollections.docs.createClientLoader({
  component(
    { toc, frontmatter, default: MDX },
    props: {
      className?: string;
    },
  ) {
    return (
      <DocsPage toc={toc} {...props}>
        <DocsTitle>{frontmatter.title}</DocsTitle>
        <DocsDescription>{frontmatter.description}</DocsDescription>
        <DocsBody>
          <MDX
            components={{
              ...(icons as unknown as MDXComponents),
              ...defaultMdxComponents,
              ...TabsComponents,
            }}
          />
        </DocsBody>
      </DocsPage>
    );
  },
});

export const Route = createFileRoute("/$")({
  component: Page,
  loader: async ({ params }) => {
    const slugs = params._splat?.split("/") ?? [];
    const data = await serverLoader({ data: slugs });
    await clientLoader.preload(data.path);
    return data;
  },
  notFoundComponent: DocsNotFoundBoundary,
});

function getSection(path: string | undefined) {
  if (!path) return "general";
  const [dir] = path.split("/", 1);
  if (!dir) return "general";
  return (
    {
      "pipelines": "pipelines",
      "api-reference": "api-reference",
      "architecture": "architecture",
      "contributing": "contributing",
    }[dir] ?? "general"
  );
}

function Page() {
  const data = useFumadocsLoader(Route.useLoaderData());

  return (
    <DocsLayout
      {...baseOptions()}
      tree={data.pageTree}
      sidebar={{
        tabs: {
          transform(option, node) {
            const meta = source.getNodeMeta(node);
            if (!meta || !node.icon) return option;
            const color = `var(--${getSection(meta.path)}-color, var(--color-fd-foreground))`;

            return {
              ...option,
              icon: (
                <div
                  className="[&_svg]:size-full rounded-lg size-full text-(--tab-color) max-md:bg-(--tab-color)/10 max-md:border max-md:p-1.5"
                  style={
                    {
                      "--tab-color": color,
                    } as object
                  }
                >
                  {node.icon}
                </div>
              ),
            };
          },
        },
      }}
    >
      <Suspense>
        {clientLoader.useContent(data.path, {
          className: "",
        })}
      </Suspense>
    </DocsLayout>
  );
}

function DocsNotFoundBoundary() {
  const { _splat } = Route.useParams();

  return <DocsNotFound path={_splat ?? ""} />;
}

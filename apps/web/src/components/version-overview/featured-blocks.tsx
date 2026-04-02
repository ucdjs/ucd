import { blocksQueryOptions } from "#functions/blocks";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Card, CardContent } from "@ucdjs-internal/shared-ui/ui/card";
import { Skeleton } from "@ucdjs-internal/shared-ui/ui/skeleton";
import { ArrowRight } from "lucide-react";

const FEATURED_BLOCK_IDS = [
  "basic-latin",
  "greek-and-coptic",
  "cyrillic",
  "arabic",
  "devanagari",
  "cjk-unified-ideographs",
  "mathematical-operators",
  "box-drawing",
] as const;

export function FeaturedBlocks({ version }: { version: string }) {
  const { data: blocks } = useQuery(blocksQueryOptions(version));

  if (!blocks) {
    return null;
  }

  const featured = FEATURED_BLOCK_IDS
    .map((id) => blocks.find((b) => b.id === id))
    .filter((b): b is NonNullable<typeof b> => b != null);

  if (featured.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Featured Blocks</h2>
        <Link
          to="/v/$version/blocks"
          params={{ version }}
          className="text-xs text-primary hover:underline inline-flex items-center gap-1"
        >
          View all blocks
          <ArrowRight className="size-3" />
        </Link>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {featured.map((block) => (
          <Link
            key={block.id}
            to="/v/$version/blocks/$id"
            params={{ version, id: block.id }}
          >
            <Card className="h-full transition-colors hover:bg-muted/50 cursor-pointer group">
              <CardContent className="p-3 space-y-1.5">
                <h3 className="font-medium text-sm leading-tight group-hover:text-primary transition-colors">
                  {block.name}
                </h3>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-mono">
                    U+
                    {block.start}
                    ..
                    {block.end}
                  </span>
                  <span>
                    {block.characterCount.toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function FeaturedBlocksSkeleton() {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    </section>
  );
}

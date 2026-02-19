import { VersionHeader } from "#components/layout/version/header";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { Button } from "@ucdjs-internal/shared-ui/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";
import { Input } from "@ucdjs-internal/shared-ui/ui/input";
import { Map, Search } from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/v/$version/blocks/")({
  component: RouteComponent,
});

const MOCK_BLOCKS = [
  "Basic Latin",
  "Latin-1 Supplement",
  "Latin Extended-A",
  "Greek and Coptic",
  "Cyrillic",
  "Hebrew",
  "Arabic",
  "Devanagari",
  "Hiragana",
  "Katakana",
  "Hangul Syllables",
  "Emoji",
  "Mathematical Alphanumeric Symbols",
  "General Punctuation",
  "Currency Symbols",
  "Arrows",
  "Box Drawing",
  "Miscellaneous Symbols",
];

function RouteComponent() {
  const { version } = Route.useParams();
  const [query, setQuery] = useState("");

  const filteredBlocks = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return MOCK_BLOCKS;
    return MOCK_BLOCKS.filter((block) => block.toLowerCase().includes(trimmed));
  }, [query]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <VersionHeader version={version} title="Blocks" />

      <div className="flex flex-1 flex-col gap-6 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
              <Map className="size-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Unicode Blocks</h1>
              <p className="text-sm text-muted-foreground">
                Browse blocks for Unicode
                {" "}
                {version}
                . Search is mocked for now.
              </p>
            </div>
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search blocks..."
              className="pl-9"
            />
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Blocks</CardTitle>
            <Badge variant="secondary">
              {filteredBlocks.length}
              {" "}
              results
            </Badge>
          </CardHeader>
          <CardContent>
            {filteredBlocks.length === 0
              ? (
                  <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                    No blocks match this search. Try another name.
                  </div>
                )
              : (
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredBlocks.map((block) => (
                      <div key={block} className="rounded-lg border bg-card/70 px-3 py-2">
                        <div className="text-sm font-medium">{block}</div>
                        <div className="text-xs text-muted-foreground">Sample range (mocked)</div>
                      </div>
                    ))}
                  </div>
                )}
          </CardContent>
        </Card>

        <div>
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<Link to="/v/$version" params={{ version }}>Back to version</Link>}
          />
        </div>
      </div>
    </div>
  );
}

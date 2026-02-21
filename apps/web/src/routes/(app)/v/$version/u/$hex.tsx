import { characterQueryOptions } from "#apis/characters";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { cn } from "@ucdjs-internal/shared-ui/lib/utils";
import { Button } from "@ucdjs-internal/shared-ui/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";
import { ArrowLeft, Check, Copy, SquareArrowOutUpRight } from "lucide-react";
import * as React from "react";

export const Route = createFileRoute("/(app)/v/$version/u/$hex")({
  component: CharacterPage,
  loader: ({ context, params }) => {
    context.queryClient.prefetchQuery(characterQueryOptions(params.hex, params.version));
  },
});

function CharacterPage() {
  const { hex, version } = Route.useParams();
  const { data: character } = useSuspenseQuery(characterQueryOptions(hex, version));
  const [copied, setCopied] = React.useState(false);

  const copyCharacter = async () => {
    try {
      await navigator.clipboard.writeText(character.character);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-8 p-4 pt-2">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            render={(
              <Link to="/v/$version" params={{ version }}>
                <ArrowLeft className="mr-1 size-4" />
                Back to Unicode
                {" "}
                {version}
              </Link>
            )}
          />
          <div className="text-sm text-muted-foreground">
            Codepoint
            {" "}
            <span className="font-mono text-foreground">{character.codepoint}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={copyCharacter}
          >
            {copied ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
            {copied ? "Copied" : "Copy character"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={(
              <Link
                to="/file-explorer/v/$"
                params={{ _splat: `${version}/ucd/UnicodeData.txt` }}
              >
                <SquareArrowOutUpRight className="size-4" />
                Open UnicodeData.txt
              </Link>
            )}
          />
        </div>
      </section>

      {/* Character Display */}
      <div className="flex flex-col items-center gap-4 rounded-2xl border bg-card/70 p-6">
        <div className="text-8xl leading-none select-all">
          {character.character}
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold font-mono">{character.codepoint}</h1>
          <p className="text-muted-foreground">{character.name}</p>
        </div>
      </div>

      {/* Character Properties */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Properties</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">General</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3">
                <PropertyRow label="Category" value={character.category} />
                <PropertyRow label="Block" value={character.block} />
                <PropertyRow label="Script" value={character.script} />
                <PropertyRow label="Age" value={character.age} />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bidirectional</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3">
                <PropertyRow label="Bidi Class" value={character.bidirectional} />
                <PropertyRow
                  label="Decomposition"
                  value={character.decomposition || "None"}
                />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Case Mapping</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3">
                <PropertyRow
                  label="Uppercase"
                  value={character.uppercase || "N/A"}
                />
                <PropertyRow
                  label="Lowercase"
                  value={character.lowercase || "N/A"}
                />
                <PropertyRow
                  label="Titlecase"
                  value={character.titlecase || "N/A"}
                />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Encodings</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3">
                <PropertyRow
                  label="UTF-8"
                  value={getUtf8Encoding(character.character)}
                  mono
                />
                <PropertyRow
                  label="UTF-16"
                  value={getUtf16Encoding(character.character)}
                  mono
                />
                <PropertyRow
                  label="Decimal"
                  value={character.character.codePointAt(0)?.toString() || ""}
                  mono
                />
              </dl>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

function PropertyRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className={cn("text-sm text-right", mono && "font-mono")}>{value}</dd>
    </div>
  );
}

function getUtf8Encoding(char: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(char);
  return Array.from(bytes).map((b) => b.toString(16).toUpperCase().padStart(2, "0")).join(" ");
}

function getUtf16Encoding(char: string): string {
  const codes: string[] = [];
  for (let i = 0; i < char.length; i++) {
    codes.push(char.charCodeAt(i).toString(16).toUpperCase().padStart(4, "0"));
  }
  return codes.join(" ");
}

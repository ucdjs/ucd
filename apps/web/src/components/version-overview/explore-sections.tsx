import { Link } from "@tanstack/react-router";
import { Card, CardContent } from "@ucdjs-internal/shared-ui/components";
import { Grid3X3, Lightbulb } from "lucide-react";

const SECTIONS = [
  {
    to: "/v/$version/blocks" as const,
    icon: Grid3X3,
    label: "Unicode Blocks",
    description: "Browse contiguous ranges of code points grouped by writing system or function",
  },
  {
    to: "/v/$version/grapheme-visualizer" as const,
    icon: Lightbulb,
    label: "Grapheme Visualizer",
    description: "Break text into grapheme clusters and inspect ZWJ sequence components",
  },
  {
    to: "/v/$version/normalization-preview" as const,
    icon: Lightbulb,
    label: "Normalization Preview",
    description: "Compare text under NFC, NFD, NFKC, and NFKD normalization forms",
  },
  {
    to: "/v/$version/bidi-linebreak" as const,
    icon: Lightbulb,
    label: "BIDI & Line Break",
    description: "Visualize bidirectional text ordering and line break opportunities",
  },
  {
    to: "/v/$version/font-glyph-view" as const,
    icon: Lightbulb,
    label: "Font & Glyph View",
    description: "See how code points map to font glyphs and rendering",
  },
] as const;

export function ExploreSections({ version }: { version: string }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold tracking-tight">Explore</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((section) => (
          <Link
            key={section.label}
            to={section.to}
            params={{ version }}
          >
            <Card className="h-full transition-colors hover:bg-muted/50 cursor-pointer group">
              <CardContent className="p-4 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <section.icon className="size-4 text-primary" />
                  <span className="font-medium text-sm group-hover:text-primary transition-colors">
                    {section.label}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {section.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}

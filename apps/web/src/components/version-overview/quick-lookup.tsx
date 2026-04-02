import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

const SAMPLE_CHARACTERS = [
  { hex: "0041", char: "A", label: "Latin A" },
  { hex: "03B1", char: "α", label: "Greek Alpha" },
  { hex: "4E16", char: "世", label: "CJK" },
  { hex: "3042", char: "あ", label: "Hiragana" },
  { hex: "0410", char: "А", label: "Cyrillic" },
  { hex: "0905", char: "अ", label: "Devanagari" },
  { hex: "2200", char: "∀", label: "Math" },
  { hex: "2764", char: "❤", label: "Heart" },
  { hex: "00A9", char: "©", label: "Copyright" },
  { hex: "221E", char: "∞", label: "Infinity" },
  { hex: "2603", char: "☃", label: "Snowman" },
  { hex: "262F", char: "☯", label: "Yin Yang" },
] as const;

export function QuickLookup({ version }: { version: string }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Quick Lookup</h2>
        <Link
          to="/v/$version/u/$hex"
          params={{ version, hex: "0041" }}
          className="text-xs text-primary hover:underline inline-flex items-center gap-1"
        >
          Codepoint inspector
          <ArrowRight className="size-3" />
        </Link>
      </div>
      <div className="flex flex-wrap gap-2">
        {SAMPLE_CHARACTERS.map((sample) => (
          <Link
            key={sample.hex}
            to="/v/$version/u/$hex"
            params={{ version, hex: sample.hex }}
            className="group flex items-center gap-2 rounded-lg border bg-card px-3 py-2 transition-colors hover:bg-muted/50 hover:border-primary/30"
          >
            <span className="text-xl leading-none">{sample.char}</span>
            <div className="flex flex-col">
              <span className="text-xs font-medium group-hover:text-primary transition-colors">
                {sample.label}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">
                U+
                {sample.hex}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export interface SourceListProps {
  sources: Array<{ id: string }>;
  className?: string;
}

export function SourceList({
  sources,
  className,
}: SourceListProps) {
  return (
    <section className={className}>
      <h2 className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
        Sources
        {" "}
        (
        {sources.length}
        )
      </h2>
      <div className="bg-card rounded-lg border border-border divide-y divide-border">
        {sources.map((source) => (
          <div className="py-1.5 px-2 rounded hover:bg-accent/30" key={source.id}>
            <code className="text-xs text-foreground/80">{source.id}</code>
          </div>
        ))}
      </div>
    </section>
  );
}

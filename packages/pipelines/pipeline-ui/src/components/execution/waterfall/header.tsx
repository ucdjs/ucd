export interface ExecutionWaterfallHeaderProps {
  selectedSpanId: string | null;
  onClear: () => void;
}

export function ExecutionWaterfallHeader({
  selectedSpanId,
  onClear,
}: ExecutionWaterfallHeaderProps) {
  return (
    <div className="flex justify-end">
      {selectedSpanId && (
        <button
          type="button"
          className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          onClick={onClear}
        >
          Clear log filter
        </button>
      )}
    </div>
  );
}

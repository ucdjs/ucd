export interface StatBadgeProps {
  label: string;
  value: number;
  newValue?: number;
}

export function StatBadge({ label, value, newValue }: StatBadgeProps) {
  return (
    <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-1.5">
      <span className="font-semibold">{value.toLocaleString()}</span>
      <span className="text-muted-foreground">{label.toLowerCase()}</span>
      {newValue != null && newValue > 0 && (
        <span className="text-xs text-green-600 dark:text-green-400">
          (+
          {newValue.toLocaleString()}
          {" "}
          new)
        </span>
      )}
    </div>
  );
}

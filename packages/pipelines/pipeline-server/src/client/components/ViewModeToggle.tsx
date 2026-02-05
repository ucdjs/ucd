import { cn } from "@ucdjs-internal/shared-ui/lib/utils";
import { Button } from "@ucdjs-internal/shared-ui/ui/button";

interface ViewModeToggleProps {
  isJsonMode: boolean;
  onToggle: () => void;
}

export function ViewModeToggle({ isJsonMode, onToggle }: ViewModeToggleProps) {
  return (
    <div className="flex items-center space-x-1 bg-muted p-1 rounded-md">
      <Button
        variant={!isJsonMode ? "secondary" : "ghost"}
        size="sm"
        onClick={() => isJsonMode && onToggle()}
        className={cn(
          "h-7 text-xs",
          !isJsonMode && "bg-background shadow-sm"
        )}
      >
        Compact
      </Button>
      <Button
        variant={isJsonMode ? "secondary" : "ghost"}
        size="sm"
        onClick={() => !isJsonMode && onToggle()}
        className={cn(
          "h-7 text-xs",
          isJsonMode && "bg-background shadow-sm"
        )}
      >
        JSON
      </Button>
    </div>
  );
}

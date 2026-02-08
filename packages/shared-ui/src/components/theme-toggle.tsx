import type { ThemeMode } from "../hooks/use-theme";
import { Moon, Sun, SunMoon } from "lucide-react";
import { useTheme } from "../hooks/use-theme";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";

const labelByTheme = {
  light: "Light",
  dark: "Dark",
  system: "System",
} as const;

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const Icon = resolvedTheme === "dark" ? Moon : Sun;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={(props) => (
        <Button variant="ghost" size="icon" className="h-7 w-7" {...props}>
          <Icon className="h-4 w-4" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      )}
      />
      <DropdownMenuContent align="end" className="min-w-40">
        {Object.entries(labelByTheme).map(([value, label]) => (
          <DropdownMenuItem key={value} onClick={() => setTheme(value as ThemeMode)}>
            {value === "system" ? <SunMoon className="mr-2 h-4 w-4" /> : null}
            {value === "light" ? <Sun className="mr-2 h-4 w-4" /> : null}
            {value === "dark" ? <Moon className="mr-2 h-4 w-4" /> : null}
            {label}
            {theme === value ? <span className="ml-auto text-xs text-muted-foreground">Active</span> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

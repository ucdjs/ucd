import { useCallback, useEffect, useMemo, useState } from "react";

export type ThemeMode = "light" | "dark" | "system";

export interface UseThemeReturn {
  theme: ThemeMode;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const STORAGE_KEY = "theme";
const DARK_CLASS = "dark";

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "system";
  const value = window.localStorage.getItem(STORAGE_KEY);
  if (value === "light" || value === "dark" || value === "system") return value;
  return "system";
}

function syncTheme(resolved: "light" | "dark") {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle(DARK_CLASS, resolved === "dark");
  document.documentElement.style.colorScheme = resolved;
}

export function useTheme(): UseThemeReturn {
  const [theme, setTheme] = useState<ThemeMode>(() => getStoredTheme());
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">(() => getSystemTheme());

  const resolvedTheme = theme === "system" ? systemTheme : theme;

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setSystemTheme(media.matches ? "dark" : "light");
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    syncTheme(resolvedTheme);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, theme);
    }
  }, [resolvedTheme, theme]);

  const setThemeCb = useCallback((nextTheme: ThemeMode) => {
    setTheme(nextTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      if (current === "light") return "dark";
      if (current === "dark") return "system";
      return "light";
    });
  }, []);

  return useMemo(() => ({
    theme,
    resolvedTheme,
    setTheme: setThemeCb,
    toggleTheme,
  }), [theme, resolvedTheme, setThemeCb, toggleTheme]);
}

export const THEME_STORAGE_KEY = "theme";

export function createThemeScript(): string {
  return `
(function(){
  try {
    var key = "${THEME_STORAGE_KEY}";
    var stored = localStorage.getItem(key);
    var theme = stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
    var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    var resolved = theme === "system" ? (prefersDark ? "dark" : "light") : theme;
    var root = document.documentElement;
    var bg = resolved === "dark" ? "#111111" : "#ffffff";
    if (resolved === "dark") {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
    } else {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    }
    root.style.backgroundColor = bg;
  } catch (_) {}
})();
  `.trim();
}

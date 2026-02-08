import { createThemeScript } from "@ucdjs-internal/shared-ui";

export function injectThemeScript(): void {
  if (typeof document === "undefined") return;
  const id = "theme-script";
  if (document.getElementById(id)) return;
  const script = document.createElement("script");
  script.id = id;
  script.textContent = createThemeScript();
  document.head.appendChild(script);
}

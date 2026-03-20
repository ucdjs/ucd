import { injectThemeScript } from "#lib/theme";
import { RouterProvider } from "@tanstack/react-router";
import { createRoot } from "react-dom/client";
import { createAppRouter } from "./app-router";
import "./index.css";

injectThemeScript();
const router = createAppRouter();

const rootElement = document.getElementById("app")!;

if (!rootElement.innerHTML) {
  const root = createRoot(rootElement);
  root.render(<RouterProvider router={router} />);
}

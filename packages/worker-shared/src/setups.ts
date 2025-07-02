import type { Hono } from "hono";

export function setupCors(app: Hono<{
  Bindings: object;
}>): void {
  app.use("*", (c, next) => {
    if (!("ENVIRONMENT" in c.env)) {
      throw new Error("ENVIRONMENT is not defined in the environment variables.");
    }

    const allowedOrigins = ["https://ucdjs.dev", "https://www.ucdjs.dev"];

    if (c.env.ENVIRONMENT === "local") {
      allowedOrigins.push("http://localhost:3000", "http://localhost:8787");
    }

    if (c.env.ENVIRONMENT === "preview") {
      allowedOrigins.push("https://preview.api.ucdjs.dev", "https://preview.unicode-proxy.ucdjs.dev");
    }

    const origin = c.req.header("origin");
    if (allowedOrigins.includes(origin || "")) {
      c.res.headers.set("Access-Control-Allow-Origin", origin || "");
      c.res.headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS, POST");
      c.res.headers.set("Access-Control-Allow-Headers", "Content-Type");
      c.res.headers.set("Access-Control-Allow-Credentials", "true");
    } else {
      c.res.headers.set("Access-Control-Allow-Origin", "");
    }

    return next();
  });
}

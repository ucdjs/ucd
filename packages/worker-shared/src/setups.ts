import type { Hono } from "hono";

export function setupCors<TEnv extends object>(app: Hono<TEnv>): void {
  app.use("*", (c, next) => {
    // @ts-expect-error Bindings is not defined in the Hono type
    const env = c.env.ENVIRONMENT || "";
    const allowedOrigins = ["https://ucdjs.dev", "https://www.ucdjs.dev"];

    if (env === "local") {
      allowedOrigins.push("http://localhost:3000", "http://localhost:8787");
    }

    if (env === "preview") {
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

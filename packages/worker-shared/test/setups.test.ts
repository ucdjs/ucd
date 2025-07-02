import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { setupCors } from "../src/setups";

describe("setupCors", () => {
  it("should allow requests from production origins", async () => {
    const app = new Hono<{
      Bindings: {
        ENVIRONMENT: string;
      };
    }>();
    const mockEnv = { ENVIRONMENT: "production" };

    setupCors(app);

    app.get("/test", (c) => c.text("OK"));

    const req = new Request("http://localhost/test", {
      headers: { origin: "https://ucdjs.dev" },
    });

    const res = await app.request(req, {}, mockEnv);

    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("https://ucdjs.dev");
    expect(res.headers.get("Access-Control-Allow-Methods")).toBe("GET, HEAD, OPTIONS, POST");
    expect(res.headers.get("Access-Control-Allow-Headers")).toBe("Content-Type");
    expect(res.headers.get("Access-Control-Allow-Credentials")).toBe("true");
  });

  it("should allow requests from www.ucdjs.dev", async () => {
    const app = new Hono<{
      Bindings: {
        ENVIRONMENT: string;
      };
    }>();
    const mockEnv = { ENVIRONMENT: "production" };

    setupCors(app);

    app.get("/test", (c) => c.text("OK"));

    const req = new Request("http://localhost/test", {
      headers: { origin: "https://www.ucdjs.dev" },
    });

    const res = await app.request(req, {}, mockEnv);

    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("https://www.ucdjs.dev");
  });

  it("should allow localhost origins in local environment", async () => {
    const app = new Hono<{
      Bindings: {
        ENVIRONMENT: string;
      };
    }>();
    const mockEnv = { ENVIRONMENT: "local" };

    setupCors(app);

    app.get("/test", (c) => c.text("OK"));

    const req = new Request("http://localhost/test", {
      headers: { origin: "http://localhost:3000" },
    });

    const res = await app.request(req, {}, mockEnv);

    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:3000");
  });

  it("should allow localhost:8787 in local environment", async () => {
    const app = new Hono<{
      Bindings: {
        ENVIRONMENT: string;
      };
    }>();
    const mockEnv = { ENVIRONMENT: "local" };

    setupCors(app);

    app.get("/test", (c) => c.text("OK"));

    const req = new Request("http://localhost/test", {
      headers: { origin: "http://localhost:8787" },
    });

    const res = await app.request(req, {}, mockEnv);

    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:8787");
  });

  it("should allow preview origins in preview environment", async () => {
    const app = new Hono<{
      Bindings: {
        ENVIRONMENT: string;
      };
    }>();
    const mockEnv = { ENVIRONMENT: "preview" };

    setupCors(app);

    app.get("/test", (c) => c.text("OK"));

    const req = new Request("http://localhost/test", {
      headers: { origin: "https://preview.api.ucdjs.dev" },
    });

    const res = await app.request(req, {}, mockEnv);

    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("https://preview.api.ucdjs.dev");
  });

  it("should allow preview unicode-proxy origin in preview environment", async () => {
    const app = new Hono<{
      Bindings: {
        ENVIRONMENT: string;
      };
    }>();
    const mockEnv = { ENVIRONMENT: "preview" };

    setupCors(app);

    app.get("/test", (c) => c.text("OK"));

    const req = new Request("http://localhost/test", {
      headers: { origin: "https://preview.unicode-proxy.ucdjs.dev" },
    });

    const res = await app.request(req, {}, mockEnv);

    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("https://preview.unicode-proxy.ucdjs.dev");
  });

  it("should reject unauthorized origins", async () => {
    const app = new Hono<{
      Bindings: {
        ENVIRONMENT: string;
      };
    }>();
    const mockEnv = { ENVIRONMENT: "production" };

    setupCors(app);

    app.get("/test", (c) => c.text("OK"));

    const req = new Request("http://localhost/test", {
      headers: { origin: "https://malicious-site.com" },
    });

    const res = await app.request(req, {}, mockEnv);

    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("");
  });

  it("should handle requests without origin header", async () => {
    const app = new Hono<{
      Bindings: {
        ENVIRONMENT: string;
      };
    }>();
    const mockEnv = { ENVIRONMENT: "production" };

    setupCors(app);

    app.get("/test", (c) => c.text("OK"));

    const req = new Request("http://localhost/test");
    const res = await app.request(req, {}, mockEnv);

    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("");
  });

  it("should not allow localhost origins in production environment", async () => {
    const app = new Hono<{
      Bindings: {
        ENVIRONMENT: string;
      };
    }>();
    const mockEnv = { ENVIRONMENT: "production" };

    setupCors(app);

    app.get("/test", (c) => c.text("OK"));

    const req = new Request("http://localhost/test", {
      headers: { origin: "http://localhost:3000" },
    });

    const res = await app.request(req, {}, mockEnv);

    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("");
  });

  it("should not allow preview origins in production environment", async () => {
    const app = new Hono<{
      Bindings: {
        ENVIRONMENT: string;
      };
    }>();
    const mockEnv = { ENVIRONMENT: "production" };

    setupCors(app);

    app.get("/test", (c) => c.text("OK"));

    const req = new Request("http://localhost/test", {
      headers: { origin: "https://preview.api.ucdjs.dev" },
    });

    const res = await app.request(req, {}, mockEnv);

    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("");
  });

  it("should apply CORS to all routes with wildcard matcher", async () => {
    const app = new Hono<{
      Bindings: {
        ENVIRONMENT: string;
      };
    }>();
    const mockEnv = { ENVIRONMENT: "production" };

    setupCors(app);

    app.get("/api/v1/test", (c) => c.text("API OK"));
    app.post("/api/v2/data", (c) => c.text("POST OK"));

    const getReq = new Request("http://localhost/api/v1/test", {
      headers: { origin: "https://ucdjs.dev" },
    });
    const postReq = new Request("http://localhost/api/v2/data", {
      method: "POST",
      headers: { origin: "https://ucdjs.dev" },
    });

    const getRes = await app.request(getReq, {}, mockEnv);
    const postRes = await app.request(postReq, {}, mockEnv);

    expect(getRes.headers.get("Access-Control-Allow-Origin")).toBe("https://ucdjs.dev");
    expect(postRes.headers.get("Access-Control-Allow-Origin")).toBe("https://ucdjs.dev");
  });
});

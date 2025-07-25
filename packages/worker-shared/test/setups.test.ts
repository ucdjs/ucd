import { Hono } from "hono";
import { describe, expect, it, vi } from "vitest";
import { setupCors, setupRatelimit } from "../src/setups";

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

describe("setupRatelimit", () => {
  interface RateLimiterBindings {
    Bindings: {
      RATE_LIMITER: RateLimit;
    };
    Variables: object;
  }

  it("should throw 500 if RATE_LIMITER is not configured", async () => {
    let triggeredError = false;
    let executed = false;

    const app = new Hono<RateLimiterBindings>()
      .onError((err, c) => {
        if (err.message.includes("RATE_LIMITER is not defined")) {
          triggeredError = true;
        }

        return c.text("Internal Server Error", 500);
      });

    setupRatelimit(app);
    app.get("/test", (c) => {
      executed = true;
      return c.text("OK");
    });

    const req = new Request("http://localhost/test");
    const mockEnv = {};

    const res = await app.request(req, {}, mockEnv);
    expect(executed).toBe(false);
    expect(triggeredError).toBe(true);
    expect(res.status).toBe(500);
  });

  it("should throw 429 if rate limit is exceeded", async () => {
    const app = new Hono<RateLimiterBindings>();

    const ratelimitStub = vi.fn(() => {
      return Promise.resolve({ success: false });
    });

    const mockEnv = {
      RATE_LIMITER: {
        limit: ratelimitStub,
      },
    };

    setupRatelimit(app);

    app.get("/test", (c) => c.text("OK"));

    const req = new Request("http://localhost/test");
    const res = await app.request(req, {}, mockEnv);

    expect(res.status).toBe(429);

    expect(res.headers.get("Content-Type")).toBe("application/json");
    expect(await res.json()).toEqual({
      message: "Too Many Requests - Please try again later",
      status: 429,
      timestamp: expect.any(String),
    });
    expect(ratelimitStub).toHaveBeenCalledWith({
      key: "unknown-ip",
    });
  });

  it("should allow requests within rate limit", async () => {
    const app = new Hono<RateLimiterBindings>();

    const ratelimitStub = vi.fn(() => {
      return Promise.resolve({ success: true });
    });

    const mockEnv = {
      RATE_LIMITER: {
        limit: ratelimitStub,
      },
    };

    setupRatelimit(app);

    app.get("/test", (c) => c.text("OK"));

    const req = new Request("http://localhost/test");
    const res = await app.request(req, {}, mockEnv);

    expect(res.status).toBe(200);
    expect(await res.text()).toBe("OK");
    expect(ratelimitStub).toHaveBeenCalledWith({
      key: "unknown-ip",
    });
  });

  it("should use cf-connecting-ip header for rate limiting", async () => {
    const app = new Hono<RateLimiterBindings>();

    const ratelimitStub = vi.fn(() => {
      return Promise.resolve({ success: true });
    });

    const mockEnv = {
      RATE_LIMITER: {
        limit: ratelimitStub,
      },
    };

    setupRatelimit(app);

    app.get("/test", (c) => c.text("OK"));
    const req = new Request("http://localhost/test", {
      headers: { "cf-connecting-ip": "127.0.0.1" },
    });
    const res = await app.request(req, {}, mockEnv);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("OK");
    expect(ratelimitStub).toHaveBeenCalledWith({
      key: "127.0.0.1",
    });
  });

  it("should use x-forwarded-for header if cf-connecting-ip is not present", async () => {
    const app = new Hono<RateLimiterBindings>();

    const ratelimitStub = vi.fn(() => {
      return Promise.resolve({ success: true });
    });

    const mockEnv = {
      RATE_LIMITER: {
        limit: ratelimitStub,
      },
    };

    setupRatelimit(app);

    app.get("/test", (c) => c.text("OK"));
    const req = new Request("http://localhost/test", {
      headers: { "x-forwarded-for": "127.0.0.1" },
    });
    const res = await app.request(req, {}, mockEnv);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("OK");
    expect(ratelimitStub).toHaveBeenCalledWith({
      key: "127.0.0.1",
    });
  });

  it("should use a fallback key if no IP headers are present", async () => {
    const app = new Hono<RateLimiterBindings>();

    const ratelimitStub = vi.fn(() => {
      return Promise.resolve({ success: true });
    });

    const mockEnv = {
      RATE_LIMITER: {
        limit: ratelimitStub,
      },
    };

    setupRatelimit(app);

    app.get("/test", (c) => c.text("OK"));
    const req = new Request("http://localhost/test");
    const res = await app.request(req, {}, mockEnv);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("OK");
    expect(ratelimitStub).toHaveBeenCalledWith({
      key: "unknown-ip",
    });
  });

  it("should fail at type checking if RATE_LIMITER is not defined", () => {
    const appWithOptionalRateLimit = new Hono<{
      Bindings: {
        RATE_LIMITER?: {
          limit: (options: any) => Promise<{ success: boolean }>;
        };
      };
    }>();

    // @ts-expect-error This should fail, since we expect RATE_LIMITER to be defined
    setupRatelimit(appWithOptionalRateLimit);
  });
});

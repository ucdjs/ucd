import { http, type HttpResponseResolver, HttpResponse } from "msw";
import { setupServer } from "msw/node";

export const MSW_SERVER = setupServer();

type Method = "get" | "post" | "put" | "delete" | "patch" | "head" | "options";
type MethodUpper = Uppercase<Method>;

function normalizeMethod(method: string): Method {
  return method.toLowerCase() as Method;
}

function parseEndpoint(pattern: `${MethodUpper} ${string}`): [Method, string] {
  const [methodStr, ...urlParts] = pattern.split(" ");
  const method = normalizeMethod(methodStr as string);
  const url = urlParts.join(" ");
  return [method, url];
}

export function mockFetch(
  urlPattern: `${MethodUpper} ${string}`,
  resolver: HttpResponseResolver<any, any, undefined>,
): void;
export function mockFetch(
  endpoints: [`${MethodUpper} ${string}`, HttpResponseResolver<any, any, undefined>][],
): void;
export function mockFetch(
  urlOrList:
    | `${MethodUpper} ${string}`
    | [`${MethodUpper} ${string}`, HttpResponseResolver<any, any, undefined>][],
  resolver?: HttpResponseResolver,
): void {
  if (Array.isArray(urlOrList)) {
    const handlers = urlOrList.map(([pattern, handlerResolver]) => {
      const [method, url] = parseEndpoint(pattern);
      return http[method](url, handlerResolver);
    });
    MSW_SERVER.use(...handlers);
    return;
  } else if (typeof urlOrList === "string" && resolver) {
    const [method, url] = parseEndpoint(urlOrList);
    MSW_SERVER.use(http[method](url, resolver));
    return;
  }

  throw new Error("invalid arguments for mockFetch");
}

export const responses = {
  notFound: () => new HttpResponse(null, { status: 404 }),
  badRequest: (body?: any) =>
    new HttpResponse(JSON.stringify(body || { error: "Bad request" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    }),
  serverError: (message?: string) =>
    new HttpResponse(
      JSON.stringify({ error: message || "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    ),
  unauthorized: () => new HttpResponse(null, { status: 401 }),
  forbidden: () => new HttpResponse(null, { status: 403 }),
  success: (body: any = {}) => HttpResponse.json(body, { status: 200 }),
  created: (body: any = {}) => HttpResponse.json(body, { status: 201 }),
};

export { http, HttpResponse };

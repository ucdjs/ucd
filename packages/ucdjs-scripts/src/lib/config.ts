import process from "node:process";

const ENV_URLS: Record<string, string> = {
  prod: "https://api.ucdjs.dev",
  production: "https://api.ucdjs.dev",
  preview: "https://preview.api.ucdjs.dev",
  local: "http://127.0.0.1:8787",
};

export interface ResolvedConfig {
  baseUrl: string;
  taskKey?: string;
  apiBaseUrl: string;
}

export function resolveBaseUrl(env?: string, baseUrl?: string): string {
  if (baseUrl) {
    return baseUrl;
  }

  if (env && ENV_URLS[env]) {
    return ENV_URLS[env];
  }

  throw new Error(
    `Invalid environment "${env}". Must be one of: ${Object.keys(ENV_URLS).join(", ")} or provide --base-url`,
  );
}

export function resolveConfig(options: {
  env?: string;
  baseUrl?: string;
  taskKey?: string;
  apiBaseUrl?: string;
}): ResolvedConfig {
  const baseUrl = resolveBaseUrl(options.env, options.baseUrl);
  const taskKey = options.taskKey || process.env.UCDJS_TASK_KEY || process.env.UCDJS_SETUP_KEY;
  const apiBaseUrl = options.apiBaseUrl || baseUrl;

  return {
    baseUrl,
    taskKey,
    apiBaseUrl,
  };
}

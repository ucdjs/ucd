import process from "node:process";

/**
 * @typedef {object} ResolvedConfig
 * @property {string} baseUrl
 * @property {string=} taskKey
 * @property {string} apiBaseUrl
 */

/** @type {Record<string, string>} */
const ENV_URLS = {
  prod: "https://api.ucdjs.dev",
  production: "https://api.ucdjs.dev",
  preview: "https://preview.api.ucdjs.dev",
  local: "http://127.0.0.1:8787",
};

/**
 * @param {string=} env
 * @param {string=} baseUrl
 * @returns {string}
 */
export function resolveBaseUrl(env, baseUrl) {
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

/**
 * @param {{
 *   env?: string,
 *   baseUrl?: string,
 *   taskKey?: string,
 *   apiBaseUrl?: string,
 * }} options
 * @returns {ResolvedConfig}
 */
export function resolveConfig(options) {
  const baseUrl = resolveBaseUrl(options.env, options.baseUrl);
  const taskKey = options.taskKey || process.env.UCDJS_TASK_KEY || process.env.UCDJS_SETUP_KEY;
  const apiBaseUrl = options.apiBaseUrl || baseUrl;

  return {
    baseUrl,
    taskKey,
    apiBaseUrl,
  };
}

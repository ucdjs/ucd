// eslint-disable-next-line node/prefer-global/process
const env = typeof process === "undefined" ? {} : process.env;

/**
 * Base URL for the Unicode API
 * @default "https://unicode-api.luxass.dev/api/v1"
 */
export const UNICODE_API_BASE_URL = env.UNICODE_API_BASE_URL || "https://unicode-api.luxass.dev/api/v1";

/**
 * Proxy URL for the Unicode API
 * @default "https://unicode-proxy.ucdjs.dev"
 */
export const UNICODE_PROXY_URL = env.UNICODE_PROXY_URL || "https://unicode-proxy.ucdjs.dev";

/**
 * Base URL for the UCDJS API
 * @default "https://api.ucdjs.dev"
 */
export const UCDJS_API_BASE_URL = env.UCDJS_API_BASE_URL || "https://api.ucdjs.dev";

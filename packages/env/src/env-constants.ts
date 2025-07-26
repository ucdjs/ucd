// eslint-disable-next-line node/prefer-global/process
const env = typeof process === "undefined" ? {} : process.env;

/**
 * Base URL for the UCDJS API
 * @default "https://api.ucdjs.dev"
 */
export const UCDJS_API_BASE_URL = env.UCDJS_API_BASE_URL || "https://api.ucdjs.dev";

export const DEFAULT_USER_AGENT = "ucdjs.dev (https://ucdjs.dev)";

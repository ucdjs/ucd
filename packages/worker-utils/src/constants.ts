export const MAX_AGE_ONE_DAY_SECONDS = 86400; // 1 day in seconds
export const MAX_AGE_ONE_WEEK_SECONDS = MAX_AGE_ONE_DAY_SECONDS * 7; // 7 days in seconds

/**
 * Maximum file size for syntax highlighting (256KB)
 * Files larger than this will be rejected to prevent worker exhaustion
 */
export const MAX_SHIKI_SIZE = 256 * 1024; // 256KB

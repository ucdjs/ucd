/**
 * HTTP header name for specifying the type of UCD statistics.
 *
 * This constant defines the header key used to indicate the type of
 * statistics being transmitted or requested in UCD-related HTTP communications.
 *
 * @example
 * ```typescript
 * import { UCD_STAT_TYPE_HEADER } from "@ucdjs/env";
 *
 * headers[UCD_STAT_TYPE_HEADER] = "file";
 * ```
 */

export const UCD_STAT_TYPE_HEADER = "X-UCD-Stat-Type";

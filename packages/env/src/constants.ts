/**
 * HTTP header name for specifying the type of UCD statistics.
 *
 * This constant defines the header key used to indicate the type of
 * statistics being transmitted or requested in UCD-related HTTP communications.
 *
 * @example
 * ```typescript
 * import { UCD_STAT_TYPE_HEADER, UCD_STAT_SIZE_HEADER } from "@ucdjs/env";
 *
 * headers[UCD_STAT_TYPE_HEADER] = "file";
 * headers[UCD_STAT_SIZE_HEADER] = "1024";
 * ```
 */

export const UCD_STAT_TYPE_HEADER = "X-UCD-Stat-Type";
export const UCD_STAT_SIZE_HEADER = "X-UCD-Stat-Size";
export const UCD_STAT_CHILDREN_HEADER = "X-UCD-Stat-Children";
export const UCD_STAT_CHILDREN_FILES_HEADER = "X-UCD-Stat-Children-Files";
export const UCD_STAT_CHILDREN_DIRS_HEADER = "X-UCD-Stat-Children-Dirs";

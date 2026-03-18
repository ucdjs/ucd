/**
 * @typedef {import("@ucdjs/schemas").ExpectedFile} ExpectedFile
 */

/**
 * @typedef {object} GlobalOptions
 * @property {string=} logLevel
 */

/**
 * @typedef {GlobalOptions & {
 *   env?: string,
 *   baseUrl?: string,
 *   taskKey?: string,
 *   versions?: string,
 *   dryRun?: boolean,
 *   batchSize?: number,
 * }} RefreshManifestsOptions
 */

/**
 * @typedef {GlobalOptions & {
 *   versions?: string,
 *   batchSize?: number,
 * }} SetupDevOptions
 */

/**
 * @typedef {object} UnicodeVersion
 * @property {string} version
 * @property {string=} mappedUcdVersion
 */

/**
 * @typedef {object} GeneratedManifest
 * @property {string} version
 * @property {{ expectedFiles: ExpectedFile[] }} manifest
 * @property {number} fileCount
 */

/**
 * @typedef {object} GenerateManifestsOptions
 * @property {string[]=} versions
 * @property {string=} apiBaseUrl
 * @property {number=} batchSize
 */

/**
 * @typedef {object} UploadResult
 * @property {boolean} success
 * @property {number} uploaded
 * @property {number} skipped
 * @property {Array<{ version: string, reason: string }>} errors
 * @property {Array<{ version: string, fileCount: number }>} versions
 */

/**
 * @typedef {object} TaskUploadQueuedResult
 * @property {boolean} success
 * @property {string} workflowId
 * @property {string} status
 * @property {string} statusUrl
 */

/**
 * @typedef {object} TaskUploadStatusResult
 * @property {string} workflowId
 * @property {string} status
 * @property {{
 *   success?: boolean,
 *   version?: string,
 *   filesUploaded?: number,
 *   duration?: number,
 *   workflowId?: string,
 * }=} output
 * @property {string=} error
 */

/**
 * @typedef {object} UploadOptions
 * @property {string} baseUrl
 * @property {string=} taskKey
 */

export {};

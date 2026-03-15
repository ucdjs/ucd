/* eslint-disable no-console */
import process from "node:process";

/**
 * @typedef {"debug" | "info" | "warn" | "error"} LogLevel
 */

/**
 * @typedef {object} Logger
 * @property {(message: string, ...args: unknown[]) => void} debug
 * @property {(message: string, ...args: unknown[]) => void} info
 * @property {(message: string, ...args: unknown[]) => void} warn
 * @property {(message: string, ...args: unknown[]) => void} error
 * @property {(level: LogLevel | string) => void} setLevel
 */

/** @type {Record<LogLevel, number>} */
const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * @param {string=} level
 * @returns {LogLevel}
 */
function normalizeLevel(level) {
  const normalized = /** @type {LogLevel} */ ((level ?? "info").toLowerCase());
  if (normalized in LOG_LEVELS) return normalized;
  throw new Error("Invalid log level. Use debug|info|warn|error.");
}

/** @type {LogLevel} */
let currentLevel = normalizeLevel(process.env.UCDJS_LOG_LEVEL ?? process.env.LOG_LEVEL ?? "info");

/**
 * @param {LogLevel | string} level
 * @returns {void}
 */
export function setLogLevel(level) {
  currentLevel = normalizeLevel(level);
}

/**
 * @param {LogLevel} level
 * @returns {boolean}
 */
function shouldLog(level) {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

/**
 * @param {LogLevel} level
 * @param {string | undefined} tag
 * @param {string} message
 * @param {unknown[]} args
 * @returns {void}
 */
function write(level, tag, message, args) {
  if (!shouldLog(level)) return;
  const prefix = tag ? `[${tag}] ` : "";
  const writer = console[level] ?? console.log;
  writer(`${prefix}${message}`, ...args);
}

/**
 * @param {string=} tag
 * @returns {Logger}
 */
export function createLogger(tag) {
  return {
    debug: (message, ...args) => write("debug", tag, message, args),
    info: (message, ...args) => write("info", tag, message, args),
    warn: (message, ...args) => write("warn", tag, message, args),
    error: (message, ...args) => write("error", tag, message, args),
    setLevel: (level) => setLogLevel(level),
  };
}

/**
 * @param {Logger} loggerInstance
 * @param {string=} level
 * @returns {void}
 */
export function applyLogLevel(loggerInstance, level) {
  if (!level) return;
  loggerInstance.setLevel(level);
}

export const logger = createLogger("ucdjs-scripts");

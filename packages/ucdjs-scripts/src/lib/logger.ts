/* eslint-disable no-console */
import process from "node:process";

export type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function normalizeLevel(level?: string): LogLevel {
  const normalized = (level ?? "info").toLowerCase() as LogLevel;
  if (normalized in LOG_LEVELS) return normalized;
  throw new Error("Invalid log level. Use debug|info|warn|error.");
}

let currentLevel: LogLevel = normalizeLevel(process.env.UCDJS_LOG_LEVEL ?? process.env.LOG_LEVEL ?? "info");

export function setLogLevel(level: LogLevel | string): void {
  currentLevel = normalizeLevel(level);
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

function write(level: LogLevel, tag: string | undefined, message: string, args: unknown[]): void {
  if (!shouldLog(level)) return;
  const prefix = tag ? `[${tag}] ` : "";
  const writer = console[level] ?? console.log;
  writer(`${prefix}${message}`, ...args);
}

export function createLogger(tag?: string) {
  return {
    debug: (message: string, ...args: unknown[]) => write("debug", tag, message, args),
    info: (message: string, ...args: unknown[]) => write("info", tag, message, args),
    warn: (message: string, ...args: unknown[]) => write("warn", tag, message, args),
    error: (message: string, ...args: unknown[]) => write("error", tag, message, args),
    setLevel: (level: LogLevel | string) => setLogLevel(level),
  };
}

export function applyLogLevel(loggerInstance: { setLevel: (level: LogLevel | string) => void }, level?: string) {
  if (!level) return;
  loggerInstance.setLevel(level);
}

export const logger = createLogger("ucdjs-scripts");

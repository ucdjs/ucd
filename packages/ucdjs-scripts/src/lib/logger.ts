type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

let currentLevel: LogLevel = "info";

export function setLogLevel(level: LogLevel): void {
  currentLevel = level;
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

function formatPrefix(level: LogLevel): string {
  const timestamp = new Date().toISOString().slice(11, 19);
  return `[${timestamp}] [${level.toUpperCase()}]`;
}

export function debug(message: string, ...args: unknown[]): void {
  if (shouldLog("debug")) {
    console.debug(formatPrefix("debug"), message, ...args);
  }
}

export function info(message: string, ...args: unknown[]): void {
  if (shouldLog("info")) {
    console.info(formatPrefix("info"), message, ...args);
  }
}

export function warn(message: string, ...args: unknown[]): void {
  if (shouldLog("warn")) {
    console.warn(formatPrefix("warn"), message, ...args);
  }
}

export function error(message: string, ...args: unknown[]): void {
  if (shouldLog("error")) {
    console.error(formatPrefix("error"), message, ...args);
  }
}

export const logger = {
  debug,
  info,
  warn,
  error,
  setLevel: setLogLevel,
};

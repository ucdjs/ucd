/* eslint-disable no-console */

export function createLogger(tag: string) {
  return {
    info: (message: string, ...args: any[]) => {
      console.info(`[${tag}] ${message}`, ...args);
    },
    warn: (message: string, ...args: any[]) => {
      console.warn(`[${tag}] ${message}`, ...args);
    },
    error: (message: string, ...args: any[]) => {
      console.error(`[${tag}] ${message}`, ...args);
    },
    debug: (message: string, ...args: any[]) => {
      console.debug(`[${tag}] ${message}`, ...args);
    },
  };
}

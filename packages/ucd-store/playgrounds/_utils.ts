// eslint-disable-next-line ts/explicit-function-return-type
export function createLogger(name: string) {
  return {
    // eslint-disable-next-line no-console
    info: (message?: any, ...optionalParams: any[]) => console.info(`[${name}] ${message}`, ...optionalParams),
    warn: (message?: any, ...optionalParams: any[]) => console.warn(`[${name}] ${message}`, ...optionalParams),
    error: (message?: any, ...optionalParams: any[]) => console.error(`[${name}] ${message}`, ...optionalParams),
    // eslint-disable-next-line no-console
    debug: (message?: any, ...optionalParams: any[]) => console.debug(`[${name}] ${message}`, ...optionalParams),
  };
}

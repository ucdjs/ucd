export function formatHighPrecisionTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const fractionalMs = ms % 1000;
  return `${seconds}.${fractionalMs.toFixed(3).padStart(6, "0")}s`;
}

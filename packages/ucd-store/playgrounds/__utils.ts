/* eslint-disable no-console, node/prefer-global/process */
const EMOJI = {
  play: "🎮",
  folder: "📁",
  document: "📝",
  pass: "✅",
  fail: "❌",
  test: "🧪",
  chart: "📊",
  sparkle: "✨",
  broom: "🧹",
};

export interface TestCase {
  description: string;
  fn: () => Promise<void> | void;
  shouldFail?: boolean;
}

export function printHeader(title: string): void {
  console.log(`${EMOJI.play} ${title}\n`);
  console.log("=".repeat(70));
}

export function printSection(title: string): void {
  console.log(`\n${"=".repeat(70)}`);
  console.log(`\n${title}\n`);
}

export function printSubsection(title: string): void {
  console.log(`\n${title}\n`);
}

export function printItem(label: string, value: unknown): void {
  const valueStr = typeof value === "object" ? JSON.stringify(value, null, 2) : String(value);
  console.log(`   ${label}: ${valueStr}`);
}

export function printFiles(files: string[]): void {
  console.log(`${EMOJI.document} Created files:`);
  for (const file of files) {
    console.log(`   - ${file}`);
  }
}

export async function runTests(testCases: TestCase[]): Promise<{ passed: number; failed: number }> {
  console.log(`${EMOJI.test} Running test cases:\n`);

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    const { description, fn, shouldFail } = testCase;

    process.stdout.write(`  ${description}... `);

    try {
      await fn();

      if (shouldFail) {
        console.log(`${EMOJI.fail} FAIL (expected error, got success)`);
        failed++;
      } else {
        console.log(`${EMOJI.pass} PASS`);
        passed++;
      }
    } catch (error) {
      if (shouldFail) {
        console.log(`${EMOJI.pass} PASS (correctly rejected)`);
        console.log(`     Error: ${(error as Error).message}`);
        passed++;
      } else {
        console.log(`${EMOJI.fail} FAIL (unexpected error)`);
        console.log(`     Error: ${(error as Error).message}`);
        failed++;
      }
    }

    console.log("");
  }

  return { passed, failed };
}

export function printResults(passed: number, failed: number): void {
  console.log("=".repeat(70));
  console.log(`\n${EMOJI.chart} Results: ${passed} passed, ${failed} failed\n`);
}

export function printFooter(): void {
  console.log(`${EMOJI.sparkle} Playground complete!\n`);
}

export function printCleanup(message: string): void {
  console.log(`${EMOJI.broom} ${message}\n`);
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / (k ** i)).toFixed(2)} ${sizes[i]}`;
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

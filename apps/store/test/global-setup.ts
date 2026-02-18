import childProcess from "node:child_process";
import path from "node:path";

export default function () {
  const label = "Built API worker";
  // eslint-disable-next-line no-console
  console.time(label);
  childProcess.execSync("pnpm wrangler build", { cwd: path.join(__dirname, "../../api") });
  // eslint-disable-next-line no-console
  console.timeEnd(label);
}

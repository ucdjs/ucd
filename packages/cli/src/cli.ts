import process from "node:process";
import { runCLI } from "./cli-utils";

runCLI(process.argv.slice(2));

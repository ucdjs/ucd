#!/usr/bin/env node
import process from "node:process";
import "@ucdjs/moonbeam/register";
import { run } from "../src/index.js";

run(process.argv.slice(2)).catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

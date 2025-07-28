import { join } from "node:path";
import { createLogger } from "./__utils";

const log = createLogger("node-playground");

const basePath = join(import.meta.dirname, ".local");
log.info("Base path for UCD Store:", basePath);

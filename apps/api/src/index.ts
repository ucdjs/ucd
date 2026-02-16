import type { WildcardHandlerOptions } from "./lib/files";
import type { HonoEnv } from "./types";
import { WorkerEntrypoint } from "cloudflare:workers";
import { fetchUnicodeFile } from "./lib/files";
import worker from "./worker";

export { ManifestUploadWorkflow } from "./workflows/manifest-upload";

export default class extends WorkerEntrypoint<HonoEnv["Bindings"]> {
  fetch(request: Request) {
    return worker.fetch(request as any, this.env, this.ctx);
  }

  async files(path: string, options: WildcardHandlerOptions) {
    return fetchUnicodeFile(path, options);
  }
}

import type { UnicodeAssetOptions } from "./lib/files";
import type { HonoEnv } from "./types";
import { WorkerEntrypoint } from "cloudflare:workers";
import { getUnicodeAsset } from "./lib/files";
import worker from "./worker";

export { ManifestUploadWorkflow } from "./workflows/manifest-upload";

export default class extends WorkerEntrypoint<HonoEnv["Bindings"]> {
  fetch(request: Request) {
    return worker.fetch(request as any, this.env, this.ctx);
  }

  async files(path: string, options: UnicodeAssetOptions) {
    return getUnicodeAsset(path, options);
  }
}

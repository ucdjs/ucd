import { notFound } from "@ucdjs-internal/worker-utils";
import {
  h3ErrorHandler,
  setupH3Cors,
  setupH3Ratelimit,
} from "@ucdjs-internal/worker-utils/h3";
import { H3, serve } from "h3/cloudflare";
import { registerFilesRoute } from "./routes/files";
import { registerLockfileRoute } from "./routes/lockfile";
import { registerSnapshotRoute } from "./routes/snapshot";

const app = new H3({
  onError: h3ErrorHandler,
});

setupH3Cors(app);
setupH3Ratelimit(app);

registerLockfileRoute(app);
registerSnapshotRoute(app);
registerFilesRoute(app);

app.get("/", () => {
  return {
    name: "UCD Store API",
    description: "Filesystem-style interface for Unicode Character Database files",
    // TODO(luxass): Keep this hand-maintained for now. If Store ever starts carrying
    // breaking app-level changes, source this from a real app version instead.
    version: "1.0.0",
    endpoints: {
      lockfile: "GET /.ucd-store.lock",
      snapshot: "GET /{version}/snapshot.json",
      files: "GET /{version}/{filepath}",
    },
    documentation: "https://docs.ucdjs.dev",
  };
});

app.all("/**", () => {
  return notFound();
});

export default serve(app);

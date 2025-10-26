import { fileTreeRoute } from "./file-tree";
import { filesRoute, storeManifestRoute } from "./files";
import { versionsRoute } from "./versions";
import { wellKnownConfig } from "./well-known";

export const MOCK_ROUTES = [
  fileTreeRoute,
  wellKnownConfig,
  storeManifestRoute,
  versionsRoute,
  filesRoute,
] as const;

import { fileTreeRoute } from "./file-tree";
import { filesRoute } from "./files";
import { versionsRoute } from "./versions";
import { wellKnownConfig, wellKnownStoreManifest } from "./well-known";

// MSW runs these handlers in left-to-right,
// but since we are using `.use`, then the order is actually reversed.
export const MOCK_ROUTES = [
  filesRoute,
  fileTreeRoute,
  wellKnownConfig,
  wellKnownStoreManifest,
  versionsRoute,
] as const;

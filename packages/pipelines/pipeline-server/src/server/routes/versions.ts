import { findPipelineFiles, loadPipelinesFromPaths } from "@ucdjs/pipelines-loader";
import { H3 } from "h3";

export const versionsRouter = new H3();

versionsRouter.get("/", async (event) => {
  const { cwd } = event.context;

  const files = await findPipelineFiles(cwd);
  const result = await loadPipelinesFromPaths(files);

  // Collect unique versions from all pipelines
  const versionsSet = new Set<string>();
  for (const pipeline of result.pipelines) {
    for (const version of pipeline.versions) {
      versionsSet.add(version);
    }
  }

  // Sort versions semantically (newest first)
  const versions = Array.from(versionsSet).sort((a, b) => {
    const aParts = a.split(".").map(Number);
    const bParts = b.split(".").map(Number);
    const aMajor = aParts[0] ?? 0;
    const aMinor = aParts[1] ?? 0;
    const aPatch = aParts[2] ?? 0;
    const bMajor = bParts[0] ?? 0;
    const bMinor = bParts[1] ?? 0;
    const bPatch = bParts[2] ?? 0;

    if (aMajor !== bMajor) return bMajor - aMajor;
    if (aMinor !== bMinor) return bMinor - aMinor;
    return bPatch - aPatch;
  });

  return {
    versions,
    count: versions.length,
  };
});

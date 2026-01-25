const source1 = definePipelineSource({
  id: "source-1",
  backend: fromFSBridgeBackend(HTTPFileSystemBridge, {
    // fsbridge options
  }),
  includes: glob("**/*.txt"),
  exclude: glob("**/excluded-*.txt"),
})

const route1 = definePipelineRoute({
  id: "route-1",
  depends: ["artifact:route-2:names", "routes:route-2"], // This will require route1 to wait for route2 to finish, and artifact:route-2:names to be available
  filter: byExt(".txt") && byVersion("15.0.0"),
  // filter: "version is 15.0.0 and extension is .txt", // This can be implemented later.
  parser: async function* (ctx) {
    // parsing logic
  },
  transforms: [
    definePipelineTransform({
      id: "transform-1",
      fn: async function* (ctx, rows) {
        yield { /* transformed row */}
      }
    }),
    definePipelineTransform({
      id: "transform-2",
      fn: async function* (ctx, rows) {
        yield { /* transformed row */}
      }
    })
  ],
  resolver: async (ctx, rows) => {
    // resolving logic
    return [/* resolved entries */]
  },
})

const route2 = definePipelineRoute({
  id: "route-2",
  filter: byName("SomeFile.txt"),
  parser: async function* (ctx) {
    // parsing logic
  },
  resolver: async (ctx, rows) => {
    await ctx.emitArtifact("names", new Map());
    // resolving logic
    return [/* resolved entries */]
  },
  cache: false,
})

const pipeline = definePipeline({
  // This will tell the pipeline, that it can run on these two versions.
  // So if the run method is called with one of these versions, it can proceed.
  // If the run method is called with other versions, it will error out.
  versions: ["15.0.0", "16.0.0"],
  inputs: [
    source1,
    // More sources?
  ],
  routes: [
    route1,
    route2,
  ],
  cache: {
    store: new FSCacheStore("/path/to/cache/dir"), // The fs cache store will cache artifacts, route results, etc.
  }
})

pipeline.run({
  versions: ["15.0.0", "16.0.0"],
  cache: false, // Disable cache for everything this run.
  onEvent: (event) => {
    console.log(`[${event.type}]`, event);
  }
})

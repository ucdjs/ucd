export const VERSION_ROUTE_PARAM = {
  in: "path",
  name: "version",
  required: true,
  schema: {
    type: "string",
    pattern: "^(latest|\\d+\\.\\d+\\.\\d+)$",
  },
  examples: {
    latest: {
      summary: "Latest stable version",
      value: "latest",
    },
    specific: {
      summary: "Specific Unicode version",
      value: "16.0.0",
    },
    old: {
      summary: "Old Unicode version",
      value: "3.1.1",
    },
  },
} as const;

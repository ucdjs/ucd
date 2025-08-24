import { MCP_SERVER } from "../mcp";

MCP_SERVER.tool(
  "hello_world",
  "Hello World!",
  {},
  async () => {
    return {
      content: [
        {
          type: "text",
          text: "Hello World!",
        },
      ],
    };
  },
);

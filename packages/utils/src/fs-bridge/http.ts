import { defineFileSystemBridge } from "../fs-bridge";

interface HTTPFileSystemBridgeOptions {
  baseUrl?: string;
}

function HTTPFileSystemBridge(options: HTTPFileSystemBridgeOptions = {}): ReturnType<typeof defineFileSystemBridge> {
  return defineFileSystemBridge({
    async read(path) {
      const url = new URL(path, options.baseUrl);
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Failed to read remote file: ${response.statusText}`);
      }
      return response.text();
    },
  });
}

export default HTTPFileSystemBridge;

import { readFile } from "node:fs/promises";
import { defineFileSystemBridge } from "../fs-bridge";

const NodeFileSystemBridge = defineFileSystemBridge({
  read(path) {
    return readFile(path, "utf-8");
  },
});

export default NodeFileSystemBridge;

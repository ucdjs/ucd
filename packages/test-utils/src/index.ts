export { asyncFromArray, collect } from "./async";
export { mockStoreApi } from "./mock-store";
export type {
  MockStoreConfig,
} from "./mock-store";
export { configure, unsafeResponse } from "./mock-store/helpers";

export function encodeBase64(content: string): string {
  // eslint-disable-next-line node/prefer-global/buffer
  return Buffer.from(content, "utf-8").toString("base64");
}

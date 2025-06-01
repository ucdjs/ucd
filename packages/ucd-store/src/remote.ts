import type { BaseUCDStoreOptions, UnicodeVersionFile } from "./store";
import { UNICODE_VERSION_METADATA } from "@luxass/unicode-utils-new";
import { invariant } from "@luxass/utils";
import { BaseUCDStore } from "./store";

export type RemoteUCDStoreOptions = BaseUCDStoreOptions;

export class RemoteUCDStore extends BaseUCDStore {
  //                      filePath, content
  private FILE_CACHE: Map<string, string> = new Map();

  constructor(options: RemoteUCDStoreOptions = {}) {
    super(options);
  }

  bootstrap(): Promise<void> {
    invariant(!this.isPopulated, "Store is already populated. Can't bootstrap it again.");
    return Promise.resolve();
  }

  get versions(): string[] {
    throw new Error("Method not implemented.");
  }
}

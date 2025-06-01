/* eslint-disable antfu/no-top-level-await */
/* eslint-disable no-console */
// TODO: remove this file when implementation is finalized.
import assert from "node:assert";
import { LocalUCDStore } from "./src/local";
import { RemoteUCDStore } from "./src/remote";
import { BaseUCDStore, createUCDStore } from "./src/store";

const store = await createUCDStore("remote");
assert(store instanceof RemoteUCDStore, "store should be an instance of RemoteUCDStore");
assert(store.isPopulated, "store should be loaded");
// assert(store.versions.length > 0, "store should have versions");

console.log(store);

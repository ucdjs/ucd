export {
  LockfileBaseError,
  LockfileBridgeUnsupportedOperation,
  LockfileInvalidError,
} from "./errors";

export {
  computeFileHash,
  computeFileHashWithoutUCDHeader,
  stripUnicodeHeader,
} from "./hash";

export {
  canUseLockfile,
  readLockfile,
  readLockfileOrUndefined,
  validateLockfile,
  writeLockfile,
} from "./lockfile";

export type { ValidateLockfileResult } from "./lockfile";

export {
  getLockfilePath,
  getSnapshotPath,
} from "./paths";

export {
  readSnapshot,
  readSnapshotOrUndefined,
  writeSnapshot,
} from "./snapshot";

export class RemoteNotFoundError extends Error {
  override name = "RemoteNotFoundError";

  constructor(message: string) {
    super(message);
  }
}

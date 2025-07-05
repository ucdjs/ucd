export class UCDStoreError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UCDStoreError";
  }
}

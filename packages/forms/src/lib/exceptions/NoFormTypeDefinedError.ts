export class NoFormTypeDefinedError extends Error {
  constructor(msg?: string) {
    super(msg);
    Object.setPrototypeOf(this, NoFormTypeDefinedError.prototype);
  }
}

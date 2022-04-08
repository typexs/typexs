export class NoFormHandlerDefinedForTypeError extends Error {
  constructor(typeName: string) {
    super(typeName + ' not defined');
    Object.setPrototypeOf(this, NoFormHandlerDefinedForTypeError.prototype);
  }
}

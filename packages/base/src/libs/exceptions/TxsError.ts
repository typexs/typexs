export class TxsError extends Error {

  /**
   * define used keys
   */
  _keys: string[] = [];

  /**
   * allow default keys
   */
  [k: string]: any;

  constructor(msg?: string) {
    super(msg);
    Object.setPrototypeOf(this, TxsError.prototype);
    this.name = TxsError.name;
  }

  set(key: string, value: any) {
    if (!this._keys.includes(key)) {
      this._keys.push(key);
    }
    this[key] = value;
  }

  toJson() {
    // TODO
  }
}

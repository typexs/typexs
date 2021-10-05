export interface IQueue {
  get(id: string): any | Promise<any>;

  set(x: any): any | Promise<any>;

  emit(event: string | symbol, ...args: any[]): boolean;

  on(event: string | symbol, listener: Function): this;

  once(event: string | symbol, listener: Function): this;

  removeAllListeners(event?: string | symbol): this;
}

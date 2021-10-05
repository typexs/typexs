export interface IQueueArray<T> {

  length: number;

  remove(id: string): void | Promise<void>;

  get(id: string): T | Promise<T>;

  set(id: T): T | Promise<T>;

  shift(): T | Promise<T>;

  pop(): T | Promise<T>;

  push(x: T): void;

  map(fn: (x: any) => any): any[] | Promise<any[]>;
}

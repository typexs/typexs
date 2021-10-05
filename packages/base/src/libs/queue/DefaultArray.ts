import { IQueueArray } from './IQueueArray';
import { IdObject } from './IdObject';

export class DefaultArray<T extends IdObject> implements IQueueArray<T> {


  entries: T[] = [];


  get length() {
    return this.entries.length;
  }

  get(id: string) {
    return this.entries.find(x => x.id === id);
  }

  set(x: T) {
    const idx = this.entries.findIndex(y => y.id === x.id);
    if (idx >= 0) {
      this.entries[idx] = x;
    } else {
      this.entries.push(x);
    }
    return x;
  }

  map(fn: (x: any) => any): any[] | Promise<any[]> {
    const res = [];
    for (const entry of this.entries) {
      res.push(fn(entry));
    }
    return res;
  }

  pop(): Promise<T> | T {
    return this.entries.pop();
  }

  push(x: T): void {
    this.entries.push(x);
  }

  shift(): Promise<T> | T {
    return this.entries.shift();
  }

  remove(id: string) {
    const idx = this.entries.findIndex(y => y.id === id);
    this.entries.splice(idx, 1);
  }


}

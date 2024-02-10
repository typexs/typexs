import { ViewArray } from './ViewArray';

export class DataNodeIterator<T> implements IterableIterator<T>, Iterable<T> {

  dataNodes: ViewArray<T>;

  idx = 0;

  start = 0;

  end: number;

  constructor(dataNodes: ViewArray<T>) {
    this.dataNodes = dataNodes;
    this.idx = 0;
    this.start = dataNodes.viewStartIdx;
    this.end = dataNodes.viewEndIdx;

    if (this.end > dataNodes.length) {
      this.end = dataNodes.length;
    }
    this.idx = this.start;
  }

  next(...args: any[]): IteratorResult<T, any> {
    const value = this.dataNodes[this.idx];
    if (this.idx < this.end) {
      this.idx++;
      return { value: value, done: false };
    }
    return { value: value, done: true };
  }

  [Symbol.iterator](): IterableIterator<T> {
    return this;
  }

}

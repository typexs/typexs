// import { ViewArray } from './ViewArray';
// import { Node } from './Node';
//
// export class DataNodeIterator<T> implements IterableIterator<Node<T>>, Iterable<Node<T>> {
//
//   dataNodes: ViewArray<T>;
//
//   idx = 0;
//
//   start = 0;
//
//   end: number;
//
//   constructor(dataNodes: ViewArray<T>) {
//     this.dataNodes = dataNodes;
//     this.idx = 0;
//     this.start = dataNodes.startIdx;
//     this.end = dataNodes.endIdx;
//
//     if (this.end > dataNodes.length) {
//       this.end = dataNodes.length;
//     }
//     this.idx = this.start;
//   }
//
//   next(...args: any[]): IteratorResult<Node<T>, any> {
//     const value = this.dataNodes[this.idx];
//     if (this.idx < this.end) {
//       this.idx++;
//       return { value: value, done: false };
//     }
//     return { value: value, done: true };
//   }
//
//   [Symbol.iterator](): IterableIterator<Node<T>> {
//     return this;
//   }
//
// }

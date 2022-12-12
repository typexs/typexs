export class DataNode<T> {

  idx: number;

  data: T;

  constructor(data: T, idx: number) {
    this.data = data;
    this.idx = idx;
  }

}

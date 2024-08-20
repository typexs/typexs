import { IIndexSpan } from './IIndexSpan';

export class IndexSpan implements IIndexSpan {

  start: number = 0;

  range: number = 25;

  size: number = 0;

  get end(){
    return this.start + this.size - 1;
  }

}

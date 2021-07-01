import {IIndexData} from './IIndexData';

export class IndexEvent {

  data: IIndexData[] = [];

  constructor(data: IIndexData[]) {
    this.data = data;
  }
}

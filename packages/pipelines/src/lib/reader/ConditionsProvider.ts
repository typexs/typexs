import { IReader } from './IReader';

export abstract class ConditionsProvider {

  private reader: IReader;

  getReader() {
    return this.reader;
  }

  setReader(reader: IReader) {
    this.reader = reader;
  }

  abstract provide(): any;

}

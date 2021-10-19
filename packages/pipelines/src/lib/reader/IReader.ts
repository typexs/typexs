import {IReaderOptions} from './IReaderOptions';

export interface IReader {

  pipe(pipe: any): IReader;

  /**
   * process entry over pipeline
   */
  doProcess(data: any): any | Promise<any>;

  run(): Promise<any>;

  run(finish?: (err: Error, data: any) => void): any | Promise<any>;

  getOptions(): IReaderOptions;


  onCatch?(fn: (data: any, err: Error) => void): IReader;


  finalize(): void;
}

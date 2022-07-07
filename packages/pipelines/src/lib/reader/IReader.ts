import {IReaderOptions} from './IReaderOptions';
import { ERROR_FUNCTION } from '../Constants';

export interface IReader {

  pipe(pipe: any): IReader;

  /**
   * process entry over pipeline
   */
  doProcess(data: any): any | Promise<any>;

  run(): Promise<any>;

  run(finish?: (err: Error, data: any) => void): any | Promise<any>;

  getOptions(): IReaderOptions;


  onCatch?(fn: ERROR_FUNCTION): IReader;


  finalize(): void;
}

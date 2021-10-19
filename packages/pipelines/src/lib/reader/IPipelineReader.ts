import {ClassType} from '@allgemein/schema-api';
import {Reader} from './Reader';
import {IReaderOptions} from './IReaderOptions';


export interface IPipelineReader {
  name: string | ClassType<Reader>;
  options: IReaderOptions;
}

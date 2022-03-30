import { ILoggerApi } from '@typexs/base/libs/logging/ILoggerApi';

export interface IProcessorOptions {
  logger?: ILoggerApi;

  [k: string]: any;
}

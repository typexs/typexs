import {ILoggerApi} from '@typexs/base';
import {IPullableQueueOptions} from '../queue/IPullableQueueOptions';

export interface IReaderOptions extends IPullableQueueOptions {
  pipe_handler?: Function;
  logger?: ILoggerApi;
  size?: number;

  /**
   * callback for finish
   */
  finishCallback?: any;

  /**
   * Activates or disables passing whole array as results
   */
  passArray?: boolean;

}

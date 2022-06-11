import {IFindOptions} from '@typexs/base/libs/storage/framework/IFindOptions';
import {IMessageOptions} from '@typexs/base/libs/messaging/IMessageOptions';

export interface IDistributedFindOptions extends IFindOptions, IMessageOptions {

  contollerHint?: { className?: string; name?: string };

  /**
   * hint for nodeId in find one
   */
  hint?: string;

}

import {IUpdateOptions} from '@typexs/base/libs/storage/framework/IUpdateOptions';
import {IMessageOptions} from '@typexs/base/libs/messaging/IMessageOptions';

export interface IDistributedUpdateOptions extends IUpdateOptions, IMessageOptions {

  contollerHint?: { className?: string; name?: string };

}

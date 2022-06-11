import {IDeleteOptions} from '@typexs/base/libs/storage/framework/IDeleteOptions';
import {IMessageOptions} from '@typexs/base/libs/messaging/IMessageOptions';

export interface IDistributedRemoveOptions extends IDeleteOptions, IMessageOptions {

  contollerHint?: { className?: string; name?: string };

}

import {ISaveOptions} from '@typexs/base/libs/storage/framework/ISaveOptions';
import {IMessageOptions} from '@typexs/base/libs/messaging/IMessageOptions';


export interface IDistributedSaveOptions extends ISaveOptions, IMessageOptions {

  contollerHint?: { className?: string; name?: string };

}

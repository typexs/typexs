import {IAggregateOptions} from '@typexs/base/libs/storage/framework/IAggregateOptions';
import {IMessageOptions} from '@typexs/base/libs/messaging/IMessageOptions';

export interface IDistributedAggregateOptions extends IAggregateOptions, IMessageOptions {

  contollerHint?: { className?: string, name?: string };
}

import {AbstractEvent} from '@typexs/base/libs/messaging/AbstractEvent';

export class DistributedUpdateResponse extends AbstractEvent {

  affected: number;
}

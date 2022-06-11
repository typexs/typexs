import {AbstractEvent} from '@typexs/base/libs/messaging/AbstractEvent';

export class DistributedRemoveResponse extends AbstractEvent {

  affected: number;

  results: any;

}

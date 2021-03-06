import {AbstractEvent} from '@typexs/base/libs/messaging/AbstractEvent';

export class DistributedFindResponse extends AbstractEvent {

  results: any[] = [];

  count: number;

  limit: number;

  offset: number;
}

import {AbstractEvent} from '@typexs/base/libs/messaging/AbstractEvent';
import {IDistributedFindOptions} from './IDistributedFindOptions';
import {IEntityRef} from '@allgemein/schema-api';
import {IEntityController} from '@typexs/base/libs/storage/IEntityController';

export class DistributedFindRequest extends AbstractEvent {

  entityType: string;

  entityRef: IEntityRef;

  entityController: IEntityController;

  conditions: any;

  options: IDistributedFindOptions;
}

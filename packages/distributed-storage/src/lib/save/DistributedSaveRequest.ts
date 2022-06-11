import {AbstractEvent} from '@typexs/base/libs/messaging/AbstractEvent';
import {IDistributedSaveOptions} from './IDistributedSaveOptions';
import {IEntityRef} from '@allgemein/schema-api';
import {IEntityController} from '@typexs/base/libs/storage/IEntityController';

export class DistributedSaveRequest extends AbstractEvent {

  objects: { [type: string]: any[] } = {};

  entityRefs: { [k: string]: IEntityRef };

  entityControllers: { [k: string]: IEntityController };

  options: IDistributedSaveOptions;
}

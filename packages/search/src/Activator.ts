import { IActivator, Injector } from '@typexs/base';
import { BasicPermission, IPermissionDef, IPermissions } from '@typexs/roles-api';
import { PERMISSION_ACCESS_SEARCH_VIEW } from './lib/Constants';
import { IndexRuntimeStatus } from './lib/IndexRuntimeStatus';
import { IndexProcessingQueue } from './lib/events/IndexProcessingQueue';

export class Activator implements IActivator, IPermissions {

  startup() {

    const status = Injector.create(IndexRuntimeStatus);
    Injector.set(IndexRuntimeStatus.NAME, status);
    Injector.set(IndexRuntimeStatus, status);
    const queue = Injector.create(IndexProcessingQueue);
    Injector.set(IndexProcessingQueue.NAME, queue);
    Injector.set(IndexProcessingQueue, queue);
  }


  permissions(): Promise<IPermissionDef[]> | IPermissionDef[] {
    return [new BasicPermission(PERMISSION_ACCESS_SEARCH_VIEW)];
  }
}

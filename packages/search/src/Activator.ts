import { IActivator, Injector } from '@typexs/base';
import { BasicPermission, IPermissionDef, IPermissions } from '@typexs/roles-api';
import { PERMISSION_ACCESS_SEARCH_VIEW } from './lib/Constants';
import { IndexRuntimeStatus } from './lib/IndexRuntimeStatus';
import { IndexProcessingQueue } from './lib/IndexProcessingQueue';

export class Activator implements IActivator, IPermissions {

  startup() {

    const status = Injector.get(IndexRuntimeStatus);
    Injector.set(IndexRuntimeStatus.NAME, status);
    const queue = Injector.get(IndexProcessingQueue);
    Injector.set(IndexProcessingQueue.NAME, queue);
  }


  permissions(): Promise<IPermissionDef[]> | IPermissionDef[] {
    return [new BasicPermission(PERMISSION_ACCESS_SEARCH_VIEW)];
  }
}

import {Injectable} from '@angular/core';
import {AbstractQueryService, AuthService, BackendService, EntityResolverService, IQueringService} from '@typexs/base-ng';
import {
  API_CTRL_DISTRIBUTED_STORAGE,
  API_CTRL_DISTRIBUTED_STORAGE_DELETE_ENTITY,
  API_CTRL_DISTRIBUTED_STORAGE_FIND_ENTITY,
  API_CTRL_DISTRIBUTED_STORAGE_GET_ENTITY,
  API_CTRL_DISTRIBUTED_STORAGE_SAVE_ENTITY,
  API_CTRL_DISTRIBUTED_STORAGE_UPDATE_ENTITY
} from '@typexs/server';


@Injectable()
export class DistributedStorageService
  extends AbstractQueryService
  implements IQueringService {

  constructor(private backend: BackendService,
              private authService: AuthService,
              private resolverService: EntityResolverService) {
    super(backend, authService, resolverService, {
      routes: {
        metadata: null,
        get: API_CTRL_DISTRIBUTED_STORAGE_GET_ENTITY,
        query: API_CTRL_DISTRIBUTED_STORAGE_FIND_ENTITY,
        aggregate: API_CTRL_DISTRIBUTED_STORAGE_FIND_ENTITY,
        delete: {route: API_CTRL_DISTRIBUTED_STORAGE_DELETE_ENTITY, method: 'delete'},
        delete_by_condition: null,
        save: API_CTRL_DISTRIBUTED_STORAGE_SAVE_ENTITY,
        update: API_CTRL_DISTRIBUTED_STORAGE_UPDATE_ENTITY,
        update_by_condition: null,
      },
      ngRoutePrefix: API_CTRL_DISTRIBUTED_STORAGE
    });
  }


}

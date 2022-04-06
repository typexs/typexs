import { get, isArray, set } from 'lodash';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  API_CTRL_STORAGE_AGGREGATE_ENTITY,
  API_CTRL_STORAGE_DELETE_ENTITIES_BY_CONDITION,
  API_CTRL_STORAGE_DELETE_ENTITY,
  API_CTRL_STORAGE_FIND_ENTITY,
  API_CTRL_STORAGE_GET_ENTITY,
  API_CTRL_STORAGE_METADATA_ALL_ENTITIES,
  API_CTRL_STORAGE_METADATA_ALL_STORES,
  API_CTRL_STORAGE_PREFIX,
  API_CTRL_STORAGE_SAVE_ENTITY,
  API_CTRL_STORAGE_UPDATE_ENTITIES_BY_CONDITION,
  API_CTRL_STORAGE_UPDATE_ENTITY,
  IStorageRefMetadata
} from '@typexs/server';
import { REGISTRY_TYPEORM } from '@typexs/base';
import { IBuildOptions, IEntityRef, RegistryFactory } from '@allgemein/schema-api';
import {
  AbstractQueryService,
  AuthService,
  BackendService,
  EntityHelper,
  EntityResolverService,
  IQueringService,
  STORAGE_REQUEST_MODE
} from '@typexs/base-ng';
import { C_RAW } from '@typexs/ng';

@Injectable()
export class StorageService extends AbstractQueryService implements IQueringService {

  constructor(
    private backend: BackendService,
    private authService: AuthService,
    private resolverService: EntityResolverService) {
    super(
      backend,
      authService,
      resolverService, {
        routes: {
          metadata: API_CTRL_STORAGE_METADATA_ALL_ENTITIES,
          get: API_CTRL_STORAGE_GET_ENTITY,
          query: API_CTRL_STORAGE_FIND_ENTITY,
          aggregate: API_CTRL_STORAGE_AGGREGATE_ENTITY,
          delete: { route: API_CTRL_STORAGE_DELETE_ENTITY, method: 'delete' },
          // eslint-disable-next-line @typescript-eslint/naming-convention
          delete_by_condition: { route: API_CTRL_STORAGE_DELETE_ENTITIES_BY_CONDITION, method: 'delete' },
          save: API_CTRL_STORAGE_SAVE_ENTITY,
          update: API_CTRL_STORAGE_UPDATE_ENTITY,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          update_by_condition: API_CTRL_STORAGE_UPDATE_ENTITIES_BY_CONDITION
        },
        registry: RegistryFactory.get(REGISTRY_TYPEORM),
        ngRoutePrefix: API_CTRL_STORAGE_PREFIX,
        registryName: REGISTRY_TYPEORM
      });
  }


  buildEntity(method: STORAGE_REQUEST_MODE, entityDef: IEntityRef, rawEntities: any | any[], options?: IBuildOptions) {
    if (method === 'aggregate') {
      return rawEntities;
    }

    let result = null;
    if (isArray(rawEntities)) {
      result = rawEntities.map(r => EntityHelper.buildEntitySingle(entityDef, r, options));
    } else {
      result = EntityHelper.buildEntitySingle(entityDef, rawEntities, options);
    }
    return result;

  }


  buildOptions(method: STORAGE_REQUEST_MODE, options: any, buildOptions: any) {
    if (get(options, C_RAW, false)) {
      set(buildOptions, C_RAW, options.raw);
    }
  }


  getStorages(): Observable<IStorageRefMetadata[]> {
    return this.backend.callApi(API_CTRL_STORAGE_METADATA_ALL_STORES);
  }


}

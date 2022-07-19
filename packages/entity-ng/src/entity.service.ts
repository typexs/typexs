import { get, isArray, set } from 'lodash';
import { Injectable } from '@angular/core';
import {
  AbstractQueryService,
  AuthService,
  BackendService,
  EntityHelper,
  EntityResolverService,
  IQueringService,
  STORAGE_REQUEST_MODE
} from '@typexs/base-ng';
import {
  API_CTRL_ENTITY_DELETE_ENTITY,
  API_CTRL_ENTITY_FIND_ENTITY,
  API_CTRL_ENTITY_GET_ENTITY,
  API_CTRL_ENTITY_METADATA_ALL_ENTITIES,
  API_CTRL_ENTITY_SAVE_ENTITY,
  API_CTRL_ENTITY_UPDATE_ENTITY,
  API_ENTITY_PREFIX
} from '@typexs/entity/libs/Constants';
import { IBuildOptions, IEntityRef } from '@allgemein/schema-api';
import { C_RAW } from '@typexs/ng';


@Injectable()
export class EntityService extends AbstractQueryService implements IQueringService {


  constructor(
    private backend: BackendService,
    private authService: AuthService,
    private resolverService: EntityResolverService) {
    super(backend, authService, resolverService, {
      ngRoutePrefix: API_ENTITY_PREFIX,
      routes: {
        metadata: API_CTRL_ENTITY_METADATA_ALL_ENTITIES,
        update: API_CTRL_ENTITY_UPDATE_ENTITY,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        update_by_condition: null,
        save: API_CTRL_ENTITY_SAVE_ENTITY,
        delete: { route: API_CTRL_ENTITY_DELETE_ENTITY, method: 'delete' },
        // eslint-disable-next-line @typescript-eslint/naming-convention
        delete_by_condition: null,
        query: API_CTRL_ENTITY_FIND_ENTITY,
        get: API_CTRL_ENTITY_GET_ENTITY,
        aggregate: null
      },
      // namespace: NAMESPACE_BUILT_ENTITY
      // registry: RegistryFactory.get(NAMESPACE_BUILT_ENTITY)
      // registryName: NAMESPACE_BUILT_ENTITY
    });
  }


  buildEntity?(method: STORAGE_REQUEST_MODE, entityRef: IEntityRef, rawEntities: any | any[], buildOptions: IBuildOptions = {}) {
    if (method === 'aggregate') {
      return rawEntities;
    }

    let result = null;
    if (isArray(rawEntities)) {
      result = rawEntities.map(r => EntityHelper.buildEntitySingle(entityRef, r, buildOptions));
    } else {
      result = EntityHelper.buildEntitySingle(entityRef, rawEntities, buildOptions);
    }
    return result;
  }

  buildOptions(method: STORAGE_REQUEST_MODE, options: any, buildOptions: any) {
    if (get(options, C_RAW, false)) {
      set(buildOptions, C_RAW, options.raw);
    }
  }

}

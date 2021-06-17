import {assign, defaults, get, isArray, keys, set} from 'lodash';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {
  API_CTRL_STORAGE_AGGREGATE_ENTITY,
  API_CTRL_STORAGE_DELETE_ENTITIES_BY_CONDITION,
  API_CTRL_STORAGE_DELETE_ENTITY,
  API_CTRL_STORAGE_FIND_ENTITY,
  API_CTRL_STORAGE_GET_ENTITY,
  API_CTRL_STORAGE_METADATA_ALL_ENTITIES,
  API_CTRL_STORAGE_METADATA_ALL_STORES,
  API_CTRL_STORAGE_SAVE_ENTITY,
  API_CTRL_STORAGE_UPDATE_ENTITIES_BY_CONDITION,
  API_CTRL_STORAGE_UPDATE_ENTITY,
  IStorageRefMetadata
} from '@typexs/server';
import {__CLASS__, __REGISTRY__, REGISTRY_TYPEORM} from '@typexs/base';
import {IBuildOptions, IEntityRef, RegistryFactory} from '@allgemein/schema-api';
import {
  AbstractQueryService,
  AuthService,
  BackendService,
  C_RAW,
  C_SKIP_BUILDS,
  EntityResolverService,
  IQueringService,
  STORAGE_REQUEST_MODE
} from '@typexs/base-ng';


@Injectable()
export class StorageService extends AbstractQueryService implements IQueringService {

  constructor(private backend: BackendService,
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
          delete: {route: API_CTRL_STORAGE_DELETE_ENTITY, method: 'delete'},
          // eslint-disable-next-line @typescript-eslint/naming-convention
          delete_by_condition: {route: API_CTRL_STORAGE_DELETE_ENTITIES_BY_CONDITION, method: 'delete'},
          save: API_CTRL_STORAGE_SAVE_ENTITY,
          update: API_CTRL_STORAGE_UPDATE_ENTITY,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          update_by_condition: API_CTRL_STORAGE_UPDATE_ENTITIES_BY_CONDITION,
        },
        registry: RegistryFactory.get(REGISTRY_TYPEORM),
        ngRoutePrefix: '/storage',
        registryName: REGISTRY_TYPEORM
      });
  }


  private static _beforeBuild(entityDef: IEntityRef, from: any, to: any) {
    keys(from).filter(k => k.startsWith('$')).forEach(k => {
      to[k] = from[k];
    });
  }

  private static _beforeBuildRaw(entityDef: IEntityRef, from: any, to: any) {
    keys(from).filter(k => !k.startsWith('$')).forEach(k => {
      to[k] = from[k];
    });
  }

  /**
   * Postprocess retrieved entity by declared build options. By default the build copy "$"
   * starting members and pass only members by entity schema definition.
   *
   * - supports "raw" find option to by pass schema filter
   * - with "skipBuilds" the build process can be overruled
   *
   *
   * @param entityDef
   * @param entity
   * @param options
   * @private
   */
  private _buildEntitySingle(entityDef: IEntityRef, entity: any, options?: IBuildOptions) {
    let def = entityDef;
    if (!entityDef) {
      if (entity[__CLASS__] && entity[__REGISTRY__]) {
        def = this.getRegistry().getEntityRefFor(entity[__CLASS__]);
      }
    }

    if (def) {
      const dynamic = def.getOptions('dynamic');
      if (get(options, C_SKIP_BUILDS, false) || dynamic === true) {
        const x = def.create();
        assign(x, entity);
        return x;
      }
      const opts = defaults(options, {
        beforeBuild: StorageService._beforeBuild
      });
      if (get(options, C_RAW, false)) {
        opts.beforeBuild = StorageService._beforeBuildRaw;
      }
      return def.build(entity, opts);
    } else {
      return entity;
    }
  }


  buildEntity(method: STORAGE_REQUEST_MODE, entityDef: IEntityRef, rawEntities: any | any[], options?: IBuildOptions) {
    if (method === 'aggregate') {
      return rawEntities;
    }

    let result = null;
    if (isArray(rawEntities)) {
      result = rawEntities.map(r => this._buildEntitySingle(entityDef, r, options));
    } else {
      result = this._buildEntitySingle(entityDef, rawEntities, options);
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

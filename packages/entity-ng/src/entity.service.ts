import {assign, defaults, get, isArray, keys, set} from 'lodash';
import {Injectable} from '@angular/core';
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
import {
  API_CTRL_ENTITY_DELETE_ENTITY,
  API_CTRL_ENTITY_FIND_ENTITY,
  API_CTRL_ENTITY_GET_ENTITY,
  API_CTRL_ENTITY_METADATA_ALL_ENTITIES,
  API_CTRL_ENTITY_SAVE_ENTITY,
  API_CTRL_ENTITY_UPDATE_ENTITY,
  API_ENTITY_PREFIX,
  NAMESPACE_BUILT_ENTITY
} from '@typexs/schema';
import {__CLASS__, __NS__, IBuildOptions, IEntityRef, RegistryFactory} from '@allgemein/schema-api';


@Injectable()
export class EntityService extends AbstractQueryService implements IQueringService {


  constructor(private backend: BackendService,
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
        delete: {route: API_CTRL_ENTITY_DELETE_ENTITY, method: 'delete'},
        // eslint-disable-next-line @typescript-eslint/naming-convention
        delete_by_condition: null,
        query: API_CTRL_ENTITY_FIND_ENTITY,
        get: API_CTRL_ENTITY_GET_ENTITY,
        aggregate: null,
      },
      // namespace: NAMESPACE_BUILT_ENTITY
      registry: RegistryFactory.get(NAMESPACE_BUILT_ENTITY),
      // registryName: REGISTRY_TXS_SCHEMA
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
      if (entity[__CLASS__] && entity[__NS__]) {
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
        beforeBuild: EntityService._beforeBuild
      });
      if (get(options, C_RAW, false)) {
        opts.beforeBuild = EntityService._beforeBuildRaw;
      }
      return def.build(entity, opts);
    } else {
      return entity;
    }
  }


  buildEntity?(method: STORAGE_REQUEST_MODE, entityRef: IEntityRef, rawEntities: any | any[], buildOptions: IBuildOptions = {}) {
    if (method === 'aggregate') {
      return rawEntities;
    }

    let result = null;
    if (isArray(rawEntities)) {
      result = rawEntities.map(r => this._buildEntitySingle(entityRef, r, buildOptions));
    } else {
      result = this._buildEntitySingle(entityRef, rawEntities, buildOptions);
    }
    return result;
  }

  buildOptions(method: STORAGE_REQUEST_MODE, options: any, buildOptions: any) {
    if (get(options, C_RAW, false)) {
      set(buildOptions, C_RAW, options.raw);
    }
  }

}

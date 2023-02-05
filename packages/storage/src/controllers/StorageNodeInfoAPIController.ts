import * as _ from 'lodash';
import { C_CONFIG_FILTER_KEYS, ClassLoader, Inject, Invoker, RuntimeLoader, Storage, System } from '@typexs/base';
import { Get, JsonController, Param } from 'routing-controllers';
import { getMetadataArgsStorage as ormMetadataArgsStorage } from 'typeorm';
import { _API_CTRL_SYSTEM, Access, C_API, ContextGroup, ServerStatusApi, SystemNodeInfoApi, WalkValues } from '@typexs/server';
import { TreeUtils } from '@allgemein/base';
import {
  _API_CTRL_STORAGE_ENTITY_VIEW,
  _API_CTRL_SYSTEM_STORAGES,
  PERMISSION_ALLOW_STORAGE_ENTITY_VIEW,
  PERMISSION_ALLOW_STORAGES_VIEW
} from '../lib/Constants';

@ContextGroup(C_API)
@JsonController(_API_CTRL_SYSTEM)
export class StorageNodeInfoAPIController {

  @Inject(System.NAME)
  system: System;

  @Inject(RuntimeLoader.NAME)
  loader: RuntimeLoader;


  @Inject(Storage.NAME)
  storage: Storage;

  @Inject(Invoker.NAME)
  invoker: Invoker;


  /**
   * TODO move to StorageAPIController
   */
  @Access(PERMISSION_ALLOW_STORAGE_ENTITY_VIEW)
  @Get(_API_CTRL_STORAGE_ENTITY_VIEW /* '/storage/:name/entities' */)
  getStorageEntities(@Param('name') name: string): any[] {
    const ref = this.storage.get(name);
    const entityNames = _.map(ref.getOptions().entities, e => {
      if (_.isString(e)) {
        return e;
      } else if (_.isFunction(e)) {
        return ClassLoader.getClassName(e);
      } else {
        return (<any>e).options.name;
      }
    });

    const tables = _.cloneDeepWith(ormMetadataArgsStorage().tables
      .filter(t => entityNames.indexOf(ClassLoader.getClassName(t.target)) !== -1));

    TreeUtils.walk(tables, (x: WalkValues) => {
      if (_.isFunction(x.value)) {
        if (_.isArray(x.parent)) {
          x.parent[x.index] = ClassLoader.getClassName(x.value);
        } else {
          x.parent[x.key] = ClassLoader.getClassName(x.value);
        }
      }
    });
    this.invoker.use(SystemNodeInfoApi).prepareStorageEntities(tables);
    return tables;
  }


  /**
   * TODO move to StorageAPIController
   */
  @Access(PERMISSION_ALLOW_STORAGES_VIEW)
  @Get(_API_CTRL_SYSTEM_STORAGES)
  getStorageInfo(): any {
    const options = _.cloneDeepWith(this.storage.getAllOptions());
    const filterKeys = this.getFilterKeys();
    TreeUtils.walk(options, (x: WalkValues) => {
      if (_.isString(x.key) && filterKeys.indexOf(x.key) !== -1) {
        delete x.parent[x.key];
      }
      if (_.isFunction(x.value)) {
        if (_.isArray(x.parent)) {
          x.parent[x.index] = ClassLoader.getClassName(x.value);
        } else {
          x.parent[x.key] = ClassLoader.getClassName(x.value);
        }
      }
    });
    this.invoker.use(SystemNodeInfoApi).prepareStorageInfo(options);
    return options;
  }


  private getFilterKeys(): string[] {
    // TODO cache this!
    let filterKeys = C_CONFIG_FILTER_KEYS; // get them from base/ConfigUtils
    const res: string[][] = <string[][]><any>this.invoker.use(ServerStatusApi).filterConfigKeys();
    if (res && _.isArray(res)) {
      filterKeys = _.uniq(_.concat(filterKeys, ...res.filter(x => _.isArray(x))).filter(x => !_.isEmpty(x)));
    }
    return filterKeys;
  }


}

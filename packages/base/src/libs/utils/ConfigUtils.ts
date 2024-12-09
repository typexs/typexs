import { Config } from '@allgemein/config';
import { ClassLoader, TreeUtils } from '@allgemein/base';
import { C_CONFIG, C_CONFIG_FILTER_KEYS, C_CONFIGURATION_FILTER_KEYS_KEY, C_KEY_SEPARATOR } from '../Constants';
import { Cache } from '../../libs/cache/Cache';
import { Injector } from '../../libs/di/Injector';
import { WalkValues } from '@allgemein/base/utils/TreeUtils';
import { cloneDeepWith, concat, get, isArray, isEmpty, isFunction, isString } from '@typexs/generic';


export class ConfigUtils {

  static getFilteredKeys(filterKeys: string[] = C_CONFIG_FILTER_KEYS) {
    return concat(filterKeys, Config.get(C_CONFIGURATION_FILTER_KEYS_KEY, []));
  }


  static clone(key: string = null, filterKeys: string[] = C_CONFIG_FILTER_KEYS) {
    filterKeys = this.getFilteredKeys(filterKeys);
    const _orgCfg = key ? Config.get(key) : Config.get();
    let cfg = cloneDeepWith(_orgCfg);
    if (!key && isArray(cfg)) {
      cfg = cfg.shift();
    }

    TreeUtils.walk(cfg, (x: WalkValues) => {
      // TODO make this list configurable! system.info.hide.keys!
      if (isString(x.key) && filterKeys.indexOf(x.key) !== -1) {
        delete x.parent[x.key];
      }
      if (isFunction(x.value)) {
        if (isArray(x.parent)) {
          x.parent[x.index] = ClassLoader.getClassName(x.value);
        } else {
          x.parent[x.key] = ClassLoader.getClassName(x.value);
        }
      }
    });
    return cfg;

  }


  static async getCached(nodeId: string, key: string = null) {
    const cache = Injector.get(Cache.NAME) as Cache;
    const config = await cache.get([C_CONFIG, nodeId].join(C_KEY_SEPARATOR))
    if (isEmpty(key)) {
      return config;
    }
    return get(config, key);

  }

}

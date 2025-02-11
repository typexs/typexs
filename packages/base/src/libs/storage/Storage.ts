import { IStorageRefOptions } from './IStorageRefOptions';
import { assign, has, isArray, isEmpty, isFunction, isObjectLike, isString, keys, values } from 'lodash';
import { C_ENTITY, K_CLS_STORAGE_TYPES, K_DEFAULT_FRAMEWORK } from '../Constants';
import { ClassType, IClassRef } from '@allgemein/schema-api';
import { IStorage } from './IStorage';
import { IStorageRef } from './IStorageRef';
import { Log } from '../../libs/logging/Log';
import { IRuntimeLoader } from '../core/IRuntimeLoader';
import { StringUtils } from '../utils/StringUtils';
import { C_DEFAULT, Glob, NotSupportedError, NotYetImplementedError, PlatformUtils } from '@allgemein/base';
import { REGISTRY_TYPEORM } from './framework/typeorm/Constants';
import { callMethod } from '../functions';
import { __SOURCE__ } from './Constants';
import { Injector } from '../di/Injector';


export class Storage {

  static NAME = 'Storage';

  nodeId: string;

  storageFramework: { [key: string]: IStorage } = {};

  defaultFramework = REGISTRY_TYPEORM;

  private storageRefs: { [key: string]: IStorageRef } = {};


  /**
   * return the name of the default framework to use
   */
  getDefaultFramework() {
    return this.defaultFramework;
  }

  /**
   * Factorize a storage ref instance through default or passed framework and
   * register the reference internally
   * @param name
   * @param options
   */
  async register(name: string, options: IStorageRefOptions): Promise<IStorageRef> {
    const useFramework = options.framework || this.getDefaultFramework();
    if (this.storageFramework[useFramework]) {
      const ref = await this.storageFramework[useFramework].create(name, options);
      this.storageRefs[name] = ref;
      const key = 'storage.' + name;
      if (!Injector.has(key)) {
        Injector.set(key, ref);
      }
      return ref;
    } else {
      throw new Error('no framework with ' + useFramework + ' exists');
    }
  }

  /**
   * Register or override framework for new storage type
   * @param cls
   * @param loader
   */
  async registerFramework<T extends IStorage>(cls: ClassType<T> | Function, loader?: IRuntimeLoader): Promise<T> {
    const obj = <IStorage>Reflect.construct(cls, []);
    if (obj && await obj.prepare(loader)) {
      this.storageFramework[obj.getType()] = obj;
    }
    return obj as any;

  }


  async prepare(config: { [name: string]: IStorageRefOptions }, loader?: IRuntimeLoader) {
    if (loader) {
      const classes = await loader.getClasses(K_CLS_STORAGE_TYPES);
      for (const cls of classes) {
        await this.registerFramework(cls, loader);
      }
    }

    if (config[K_DEFAULT_FRAMEWORK]) {
      this.defaultFramework = (config as any)[K_DEFAULT_FRAMEWORK];
    }

    // keys starting with undercore or dollar are reserved for generic configuration
    const storageNames =  Object.keys(config).filter(x => !/^(_|\$)/.test(x));

    // const storageRefs = [];
    // iterate over storage configurations
    for (const name of storageNames) {
      const settings: IStorageRefOptions = config[name];
      await this.registerStorageRef(name, settings, loader);
    }

    /**
     * Check storage refs which extend others
     */
    for (const ref of this.getStorageRefs()) {
      let _extended = [];
      const extended = ref.getOptions().extends;
      if (isString(extended)) {
        _extended.push(extended);
      } else {
        _extended = extended;
      }

      if (!isEmpty(_extended)) {
        for (const ext of _extended) {
          const extRef = this.get(ext);
          if (extRef) {
            extRef.addExtendedStorageRef(ref);
            ref.addExtendingStorageRef(extRef);
          }
        }
      }
    }


    /**
     * TODO load from backend if exist
     */
  }


  /**
   * Register a storage ref by settings
   *
   * @param name
   * @param settings
   * @param loader
   */
  async registerStorageRef(name: string, settings: IStorageRefOptions, loader?: IRuntimeLoader) {
    // load programatically declared entities
    let entities: Function[] = [];
    if (loader) {
      // load entities handled by storage
      entities = loader.getClasses([C_ENTITY, name].join('.'));
      // check if classes are realy for typeorm
      if (has(settings, 'extends')) {
        // if extends property is set
        let _extends = [];
        if (isString(settings.extends)) {
          _extends.push(settings.extends);
        } else {
          _extends = settings.extends;
        }
        _extends.forEach((x: string) => {
          const classEntitiesAdditional = loader
            .getClasses([C_ENTITY, x].join('.'));
          if (classEntitiesAdditional.length > 0) {
            entities.push(...classEntitiesAdditional);
          }
        });
      }
    }

    const replace = {};
    const declaredEntities = settings.entities || [];
    for (let i = 0; i < declaredEntities.length; i++) {
      // check if is file path
      // check if is http
      // check if is glob -> remove -> add matched files
      // if function add
      let entry = declaredEntities[i];

      if (isString(entry)) {
        let object = null;
        if (/^\s*{/.test(entry) && /}\s*$/.test(entry)) {
          try {
            object = JSON.parse(entry);
          } catch (e) {
            Log.error(e);
          }
        } else {
          const type = StringUtils.checkIfPathLocation(entry);
          let path;
          switch (type) {
            case 'url':
            case 'unknown':
              throw new NotYetImplementedError('TODO');
            case 'glob':
              try {
                const appdir = loader.getOptions().appdir;
                if (!PlatformUtils.isAbsolute(entry)) {
                  entry = PlatformUtils.join(appdir, entry);
                }
                const paths = await Glob.async(entry);
                const entries = [];
                for (const path of paths) {
                  object = await this.fromPath(path);
                  if (isArray(object)) {
                    entries.push(...object);
                  } else {
                    entries.push(object);
                  }
                }
                object = entries;
              } catch (e) {
                Log.error(e);
              }
              break;
            case 'relative':
            case 'absolute':
              path = type === 'relative' ? PlatformUtils.pathResolveAndNormalize(entry) : entry;
              object = await this.fromPath(path);
              break;
          }
        }
        if (object) {
          replace[entry] = object;
        }
      } else if (isObjectLike(entry)) {
        entities.push(entry);
      } else if (isFunction(entry)) {
        entities.push(entry);
      }
    }


     Object.keys(replace).map(k => {
      const index = declaredEntities.findIndex(v => v === k);
      declaredEntities.splice(index, 1);
      if (isArray(replace[k])) {
        entities.push(...replace[k]);
      } else {
        entities.push(replace[k]);
      }
    });

    const _settings: IStorageRefOptions = assign(settings, { entities: entities }, { name: name });
    Log.debug('storage register ' + name + ' with ' + entities.length + ' entities');
    const storageRef = await this.register(name, _settings);
    if (!storageRef) {
      throw new Error('storage ref with "' + name + '" could not be created.');
    }

    // if initialize method is present then run it
    if (storageRef.initialize) {
      await storageRef.initialize();
    }

    if (storageRef.getOptions().connectOnStartup) {
      await storageRef.prepare();
    }

    return storageRef;
  }


  async fromPath(path: string) {
    let object = null;
    try {
      if (/\.json$/.test(path)) {
        // json
        const content = (await PlatformUtils.readFile(path)).toString('utf-8');
        object = JSON.parse(content);
        Object.defineProperty(object, __SOURCE__, { value: path });
      } else if (/\.(t|j)s$/.test(path)) {
        const mod = await import(path.replace(/\.(t|j)s$/, ''));
        object = [];
         Object.keys(mod).map(x => {
          const value = mod[x];
          Object.defineProperty(value, __SOURCE__, { value: path });
          if (isFunction(value)) {
            object.push(value);
          } else if (isObjectLike(value)) {
            object.push(value);
          }
        });
      } else {
        throw new NotSupportedError('path or content not supported');
      }
    } catch (e) {
      Log.error(e);
    }
    return object;

  }


  /**
   * Returns storage ref for the given classRef or machineName
   * @param classRef
   */
  forClass<X extends IStorageRef>(classRef: string | Function | IClassRef): X {
    for (const k in this.storageRefs) {
      if (this.storageRefs[k].hasEntityClass(classRef)) {
        return this.storageRefs[k] as X;
      }
    }
    return null;
  }


  get<X extends IStorageRef>(name: string = C_DEFAULT): X {
    return this.storageRefs[name] as X;
  }


  /**
   * Return registered storage references
   */
  getStorageRefs(): IStorageRef[] {
    return values(this.storageRefs);
  }

  /**
   * Return registered storage frameworks
   */
  getStorageFrameworks(): IStorage[] {
    return values(this.storageFramework);
  }


  getNames() {
    return  Object.keys(this.storageRefs);
  }


  getAllOptions() {
    return this.getStorageRefs().map(ref => ref.getOptions());
  }

  /**
   * Unregister a storage reference
   */
  async unregister(refOrName: string | IStorageRef) {
    const name = isString(refOrName) ? refOrName : refOrName.getName();
    const ref = this.get(name);
    if (ref) {
      delete this.storageRefs[name];
      const key = 'storage.' + name;
      if (Injector.has(key)) {
        Injector.remove(key);
      }
      await ref.shutdown(false);
    }
  }

  async shutdown() {
    const ps = this.getStorageRefs().map(async x => {
      try {
        await x.shutdown();
      } catch (e) {
        Log.error(e);
      }
    });
    const res = await Promise.all(ps);
    await callMethod(this.getStorageFrameworks(), 'shutdown', { throwMode: 'log' });
    return res;
  }

}



import { Config, Inject, Injector, Invoker, Log, Storage } from '@typexs/base';
import { ARGV_SKIP_INDEXING, C_SEARCH_INDEX } from './Constants';
import { IndexEntityRef } from './registry/IndexEntityRef';
import { isArray, isString } from 'lodash';
import { IIndexStorageRef } from './IIndexStorageRef';
import { ClassRef, ClassType } from '@allgemein/schema-api';
import { IndexElasticApi } from '../api/IndexElastic.api';

export class IndexRuntimeStatus {

  static NAME = IndexRuntimeStatus.name;

  @Inject(Storage.NAME)
  private storage: Storage;

  private invoker: Invoker;

  private _checked: boolean = false;

  private enabled: boolean = false;

  private workerActive: boolean = false;

  private types: { ref: string; registry: string; className: string }[] = [];

  // private storageRefs: { [ref: string]: IStorageRef } = {};

  activateWorker() {
    this.workerActive = true;
  }

  isWorkerActive() {
    return this.workerActive;
  }

  getTypes() {
    return this.types;
  }

  getTypeForObject(obj: any, registry: string) {
    const className = ClassRef.getClassName(obj);
    return this.types.find(x => x.className === className && x.registry === registry);
  }

  getStorageRef(name: string): IIndexStorageRef {
    return Injector.get('storage.' + name);
  }


  getStorage() {
    return this.storage;
  }


  getType(cls: string | ClassType<any>, registry: string) {
    let res: string = null;
    if (!isString(cls)) {
      res = ClassRef.getClassName(cls);
    } else {
      res = cls;
    }
    return this.types.find(x => x.className === res && x.registry === registry);
  }


  hasType(cls: string | ClassType<any>, registry: string) {
    const x = this.getType(cls, registry);
    return !!x;
  }


  checkIfActive() {
    if (!this._checked) {
      this._checked = true;
      const skipIndexing = Config.get(ARGV_SKIP_INDEXING, false);
      if (skipIndexing) {
        this.enabled = false;
      } else {
        this.storage.getNames().forEach(ref => {
          const storageRef = this.storage.get(ref);
          if (storageRef.getFramework() === C_SEARCH_INDEX) {
            Log.debug('found search-index storage type for ' + storageRef.getName());
            storageRef.getEntityRefs().forEach((entityRef: IndexEntityRef) => {
              const entity = entityRef.getEntityRef();
              Log.debug('--> marking type ' + entity.getClassRef().name + ' (ns: ' + entity.getNamespace() + ') for indexing in ' + ref);
              this.types.push({
                className: entity.getClassRef().name,
                ref: ref,
                registry: entity.getNamespace()
              });
            });
          }
        });
        this.enabled = this.types.length > 0;
      }
    }
    return this.enabled;
  }


  isIndexable(className: string, obj: any, registry: string) {
    const results = this.getInvoker().use(IndexElasticApi).isIndexable(className, obj, registry);
    let pass = false;
    if (results && isArray(results)) {
      if (results.length > 0) {
        pass = results.reduce((previousValue, currentValue) => previousValue && currentValue, true);
      } else {
        pass = true;
      }
    }
    return pass;
  }


  getInvoker() {
    if (!this.invoker) {
      this.invoker = Injector.get(Invoker.NAME);
    }
    return this.invoker;
  }

}

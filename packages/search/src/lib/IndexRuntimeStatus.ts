import {Inject, IStorageRef, Storage} from '@typexs/base';
import {C_INDEX} from './Constants';
import {IndexEntityRef} from './registry/IndexEntityRef';
import * as _ from 'lodash';
import {ClassUtils} from '@allgemein/base';

export class IndexRuntimeStatus {

  @Inject(Storage.NAME)
  private storage: Storage;

  private _checked: boolean = false;

  private enabled: boolean = false;

  private workerActive: boolean = false;

  private types: { [className: string]: { ref: string; registry: string } } = {};

  private storageRefs: { [ref: string]: IStorageRef } = {};

  activateWorker() {
    this.workerActive = true;
  }

  isWorkerActive() {
    return this.workerActive;
  }

  getTypes() {
    return this.types;
  }

  getTypeForObject(obj: any) {
    const className = ClassUtils.getClassName(obj);
    return this.types[className];
  }

  getStorageRef(name: string) {
    return this.storageRefs[name];
  }

  getStorage() {
    return this.storage;
  }

  checkIfActive() {
    if (!this._checked) {
      this._checked = true;
      this.storage.getNames().forEach(ref => {
        const storageRef = this.storage.get(ref);
        if (storageRef.getFramework() === C_INDEX) {
          storageRef.getEntityRefs().forEach((entityRef: IndexEntityRef) => {
            this.types[entityRef.getEntityRef().name] = {
              ref: ref,
              registry: entityRef.getEntityRef().getRegistry().getLookupRegistry().getNamespace()
            };
            if (!this.storageRefs[ref]) {
              this.storageRefs[ref] = storageRef;
            }

          });
        }
      });
      this.enabled = _.keys(this.types).length > 0;
    }
    return this.enabled;
  }

}

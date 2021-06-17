import {ClassesLoader, Inject, RuntimeLoader} from '@typexs/base';
import {C_NG_MODUL} from '../Constants';

import {INgModuleDef} from './INgModuleDef';


export class NgMetaDataCollector {

  @Inject('RuntimeLoader')
  loader: RuntimeLoader;

  private _ngModules: INgModuleDef[] = [];


  get modules() {
    return this._ngModules;
  }

  prepare() {
    this.collectNgModules();
  }


  collectNgModules() {
    const clazzes = this.loader.getClasses(C_NG_MODUL);
    this._ngModules = [];
    for (const clazz of clazzes) {
      const source = ClassesLoader.getSource(clazz);
      const modul = ClassesLoader.getModulName(clazz);

      const ngModule: INgModuleDef = {
        module: modul,
        name: clazz.name,
        clazz: clazz,
        source: source
      };
      this._ngModules.push(ngModule);
    }
    return this.modules;
  }
}

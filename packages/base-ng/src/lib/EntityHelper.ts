import { IBuildOptions, IEntityRef, RegistryFactory } from '@allgemein/schema-api';
import { __CLASS__, __REGISTRY__, C_FLEXIBLE } from '@typexs/base';
import { assign, defaults, get, has, keys } from 'lodash';
import { C_RAW, C_SKIP_BUILDS } from '@typexs/ng';

export class EntityHelper {

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
  static buildEntitySingle(entityDef: IEntityRef, entity: any, options?: IBuildOptions) {
    let def = entityDef;
    if (!entityDef) {
      if (entity[__CLASS__] && entity[__REGISTRY__]) {
        def = RegistryFactory.get(entity[__REGISTRY__]).getEntityRefFor(entity[__CLASS__]);
      }
    }

    if (def) {
      const classRef = def.getClassRef();
      const dynamic = def.getOptions(C_FLEXIBLE);
      if (get(options, C_SKIP_BUILDS, false) || dynamic === true || classRef.isPlaceholder()) {
        const x = def.create(false);
        if(has(entity, __CLASS__)){
          delete entity[__CLASS__];
        }
        if(has(entity, __REGISTRY__)){
          delete entity[__REGISTRY__];
        }
        assign(x, entity);
        return x;
      }
      const opts = defaults(options, {
        beforeBuild: this._beforeBuild
      });
      if (get(options, C_RAW, false)) {
        opts.beforeBuild = this._beforeBuildRaw;
      }
      return def.build(entity, opts);
    } else {
      return entity;
    }
  }


  private static _beforeBuild(entityDef: IEntityRef, from: any, to: any) {
     Object.keys(from).filter(k => k.startsWith('$')).forEach(k => {
      to[k] = from[k];
    });
  }

  private static _beforeBuildRaw(entityDef: IEntityRef, from: any, to: any) {
     Object.keys(from).filter(k => !k.startsWith('$')).forEach(k => {
      to[k] = from[k];
    });
  }

}

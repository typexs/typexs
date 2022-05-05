import { clone, first, get, has, isEmpty, isFunction, isNull, keys, last, snakeCase, values } from 'lodash';
import { Injectable } from '@angular/core';
import { ClassRef, IEntityRef, LookupRegistry, METATYPE_ENTITY } from '@allgemein/schema-api';
import { IQueringService } from './../api/querying/IQueringService';
import { forkJoin } from 'rxjs';
import { C_LABEL, K_ENTITY_BUILT, LabelHelper } from '@typexs/base';
import { IEntityResolveOptions } from './IEntityResolveOptions';


@Injectable()
export class EntityResolverService {

  ngEntityPrefix = 'entity';

  cache: { [k: string]: any } = {};

  queryServices: IQueringService[] = [];


  registerService(service: IQueringService) {
    if (!this.queryServices.find(x => x === service)) {
      this.queryServices.push(service);
    }
  }

  isLoaded() {
    return forkJoin(this.queryServices.map(x => x.isLoaded()));
  }

  /**
   * Puts idKeys of an entity correctly to an uri path together
   *
   * @param entityRef
   * @param idKeys
   */
  defaultRouteBuilder(entityRef: IEntityRef, idKeys: { [prop: string]: any }) {
    if (keys(idKeys).length === 0) {
      throw new Error('Can\'t build route with empty ids');
    }

    let _idKeys = clone(idKeys);
    if (has(_idKeys, '_id')) {
      // TODO workaround for object of classes with inherited identifiers, reduce to _id
      _idKeys = { _id: _idKeys._id };
    }

    return ['',
      this.ngEntityPrefix,
      snakeCase(entityRef.name),
      encodeURIComponent(values(_idKeys).join('--'))
    ].join('/');
  }

  getEntityRef(obj: any, opts?: IEntityResolveOptions): IEntityRef {
    opts = opts || {};
    let returnRef = null;
    const className = ClassRef.getClassName(obj);
    if (['Object', 'Array'].includes(className)) {
      return returnRef;
    }
    // const key = 'class.' + snakeCase(className);
    // if (this.cache[key]) {
    //   return this.cache[key];
    // }
    // const lookupNames = LookupRegistry.getRegistryNamespaces();
    const namespace = get(opts, 'namespace', null);
    const refs = LookupRegistry.filter(METATYPE_ENTITY,
      (x: IEntityRef) =>
        (snakeCase(x.getClassRef().name) === snakeCase(className)) || (snakeCase(x.name) === snakeCase(className))
        &&
        !x.getOptions(K_ENTITY_BUILT, false)
        && (isNull(namespace) || x.getNamespace() === namespace)
    ) as IEntityRef[];

    if (refs.length === 1) {
      returnRef = first(refs);
    } else if (refs.length > 1) {
      if (namespace) {
        returnRef = refs.find(x => x.getNamespace() === namespace);
      }

      if (opts.selector && isFunction(opts.selector)) {
        // user defined search
        returnRef = opts.selector(refs);
      }

      if (!returnRef) {
        // search for same name
        returnRef = refs.find(x => snakeCase(x.name) === snakeCase(className));
      }

      if (!returnRef) {
        // fallback take last entry
        returnRef = last(refs);
      }
    }
    // this.cache[key]< = returnRef;
    return returnRef;
  }

  getServiceForEntity(entityRef: IEntityRef) {
    if (!entityRef) {
      return null;
    }
    return this.queryServices.find(x => !isEmpty(x.getEntityRefs().find(x => x === entityRef)));
  }

  getServiceFor(obj: any, opts?: IEntityResolveOptions) {
    const entityRef = this.getEntityRef(obj, opts);
    return this.getServiceForEntity(entityRef);
  }

  getIdKeysFor(obj: any, opts?: IEntityResolveOptions) {
    const predefinedIdKeys: { key: string; optional: boolean }[] = get(opts, 'idKeys', []);
    const retPre = {};
    let optional = true;
    if (!isEmpty(predefinedIdKeys)) {
      for (const key of predefinedIdKeys) {
        optional = optional && get(key, 'optional', true);
        if (!get(key, 'optional', false) && !has(obj, key.key)) {
          throw new Error('Can\'t resolve fixed key ' + JSON.stringify(key) + ' for object ' + JSON.stringify(obj));
        } else if (has(obj, key.key)) {
          retPre[key.key] = clone(obj[key.key]);
        }
      }
    }


    if (keys(retPre).length > 0) {
      return retPre;
    } else if (!optional) {
      throw new Error('Can\'t resolve fixed keys ' + JSON.stringify(predefinedIdKeys) + ' for object ' + JSON.stringify(obj));
    }

    const entityRef = this.getEntityRef(obj, opts);
    if (!entityRef) {
      return null;
    }

    const key = 'id.' + snakeCase(entityRef.name);
    if (this.cache[key]) {
      return this.cache[key](obj);
    }

    const idProps = entityRef.getPropertyRefs().filter(x => x.isIdentifier());
    this.cache[key] = (obj: any) => {
      const ret = {};
      idProps.forEach(x => {
        ret[x.name] = x.get(obj);
      });
      return ret;
    };
    return this.cache[key](obj);
  }


  getRouteFor(obj: any, opts?: IEntityResolveOptions) {
    const entityRef = this.getEntityRef(obj, opts);
    if (!entityRef) {
      return null;
    }
    let idKeys = {};
    if (get(opts, 'idSelector', false)) {
      idKeys = opts.idSelector(entityRef, obj);
    }
    if (keys(idKeys).length === 0) {
      idKeys = this.getIdKeysFor(obj, opts);
    }
    return this.defaultRouteBuilder(entityRef, idKeys);
  }


  getLabelFor(obj: any, opts?: IEntityResolveOptions) {
    if (obj[C_LABEL] && isFunction(obj[C_LABEL])) {
      return obj[C_LABEL]();
    } else if (obj[C_LABEL]) {
      return obj[C_LABEL];
    } else if (obj['ngLabel'] && isFunction(obj['ngLabel'])) {
      return obj['ngLabel']();
    } else if (obj['ngLabel']) {
      return obj['ngLabel'];
    } else {
      const entityRef = this.getEntityRef(obj, opts);
      return LabelHelper.labelForEntity(obj, entityRef);
    }
  }

}

import {isEmpty, isFunction, snakeCase, values} from 'lodash';
import {Injectable} from '@angular/core';
import {IEntityRef, LookupRegistry, METATYPE_ENTITY} from '@allgemein/schema-api';
import {IQueringService} from './../api/querying/IQueringService';
import {forkJoin} from 'rxjs';
import {ComponentRegistry} from '@typexs/ng';


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

  defaultRouteBuilder(entityRef: IEntityRef, idKeys: { [prop: string]: any }) {
    return ['', this.ngEntityPrefix, snakeCase(entityRef.name), encodeURIComponent(values(idKeys).join('--'))].join('/');
  }

  getEntityRef(obj: any): IEntityRef {
    const className = ComponentRegistry.getClassName(obj);
    if (['Object', 'Array'].includes(className)) {
      return null;
    }
    const key = 'class.' + snakeCase(className);
    if (this.cache[key]) {
      return this.cache[key];
    }
    const returnRef = LookupRegistry.find(METATYPE_ENTITY, (x: IEntityRef) => snakeCase(x.name) === snakeCase(className)) as IEntityRef;
    if (!returnRef) {
      return null;
    }
    this.cache[key] = returnRef;
    return returnRef;
  }

  getServiceForEntity(entityRef: any) {
    if (!entityRef) {
      return null;
    }
    return this.queryServices.find(x => !isEmpty(x.getRegistry().listEntities(x => x === entityRef)));
  }

  getServiceFor(obj: any) {
    const entityRef = this.getEntityRef(obj);
    return this.getServiceForEntity(entityRef);
  }

  getIdKeysFor(obj: any) {
    if (obj['ngRoute'] && isFunction(obj['ngRoute'])) {
      return obj['ngRoute']();
    }
    const entityRef = this.getEntityRef(obj);
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


  getLabelKeysFor(obj: any) {
    const entityRef = this.getEntityRef(obj);
    if (!entityRef) {
      return null;
    }
    const key = 'label.' + snakeCase(entityRef.name);
    if (this.cache[key]) {
      return this.cache[key](obj);
    }
    const labelProps = entityRef.getPropertyRefs().filter(x => x.getOptions('form') === 'label');


    this.cache[key] = (obj: any) => {
      const ret = {};
      labelProps.forEach(x => {
        ret[x.name] = x.get(obj);
      });
      return ret;
    };
    return this.cache[key](obj);
  }


  getRouteFor(obj: any) {
    const entityRef = this.getEntityRef(obj);
    if (!entityRef) {
      return null;
    }
    const idKEys = this.getIdKeysFor(obj);
    return this.defaultRouteBuilder(entityRef, idKEys);
  }


  getLabelFor(obj: any) {
    if (obj['label'] && isFunction(obj['label'])) {
      return obj['label']();
    }
    if (obj['ngLabel'] && isFunction(obj['ngLabel'])) {
      return obj['ngLabel']();
    }

    const keys = this.getLabelKeysFor(obj);
    if (keys === null) {
      return 'Unknown';
    }
    const _values = values(keys);
    if (_values.length === 0) {
      return 'Unknown';
    }
    const label = _values.join(' - ').trim();
    return isEmpty(label) ? 'Unknown' : label;
  }

}

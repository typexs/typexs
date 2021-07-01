import {IndexEntityRegistry} from '../registry/IndexEntityRegistry';
import {IndexEntityRef} from '../registry/IndexEntityRef';
import {ClassRef, IClassRef, IEntityRef} from 'commons-schema-api';
import {IElasticFieldDef} from './IElasticFieldDef';
import {ClassUtils} from '@allgemein/base';

export class ElasticUtils {


  static flattenProperties(sourceRef: IEntityRef | IClassRef,
                           prefix: string = '',
                           done: any[] = []): IElasticFieldDef[] {
    const fields = [];
    for (const prop of sourceRef.getPropertyRefs()) {
      const _prefix = [prefix, prop.name].filter(x => !!x).join('.');
      if (prop.isReference()) {
        const ref = prop.getTargetRef();
        const _refs = ClassRef.filter(r => r.getClass() === ref.getClass() && !done.includes(r.getClass()));
        if (_refs.length === 0) {
          continue;
        }
        _refs.map(r => done.push(r.getClass()));
        const subFields = [].concat(..._refs.map(r => this.flattenProperties(r, _prefix, done)));
        fields.push(...subFields);
      } else {
        let type = prop.getType();
        if (type) {
          type = type.toLowerCase();
          fields.push({type: type, name: _prefix, className: sourceRef.name});
        }
      }
    }
    return fields;
  }

  static resolveNameByIndex(instance: any): string {
    const xsdef: IndexEntityRef = IndexEntityRegistry.$().getEntityRefFor(instance);
    if (xsdef) {
      return xsdef.getIndexName();
    } else {
      throw new Error('resolveNameByIndex not found for instance: ' + JSON.stringify(instance));
    }
  }

  static resolveByIndexName<T>(objs: T[]) {
    const resolved: { [entityType: string]: T[] } = {};
    for (const obj of objs) {
      const entityName = this.resolveNameByIndex(obj);
      if (!resolved[entityName]) {
        resolved[entityName] = [];
      }
      resolved[entityName].push(obj);

    }
    return resolved;
  }


  static resolveNameClassName(instance: any): string {
    return ClassUtils.getClassName(instance);
  }

  static resolveByClassName<T>(objs: T[]) {
    const resolved: { [entityType: string]: T[] } = {};
    for (const obj of objs) {
      const entityName = this.resolveNameClassName(obj);
      if (!resolved[entityName]) {
        resolved[entityName] = [];
      }
      resolved[entityName].push(obj);

    }
    return resolved;
  }
}

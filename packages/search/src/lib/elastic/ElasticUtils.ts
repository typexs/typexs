import { IndexEntityRegistry } from '../registry/IndexEntityRegistry';
import { IndexEntityRef } from '../registry/IndexEntityRef';
import { ClassRef, IClassRef, IEntityRef } from '@allgemein/schema-api';
import { IElasticFieldDef } from './IElasticFieldDef';
import { ClassUtils } from '@allgemein/base';
import { isString, keys } from 'lodash';
import { DEFAULT_TEXT_MAPPING, ELASTIC_TYPES } from './Constants';

export class ElasticUtils {

  static indexName(name: string) {
    if (/_xdx$/.test(name)) {
      return name;
    }
    return name + '_xdx';
  }

  static aliasName(name: string) {
    return name.replace(/_xdx$/, '');
  }

  static mapType(jsType: string): ELASTIC_TYPES {
    // TODO add override here ...
    switch (jsType) {
      case 'string':
        return 'text';
      case 'date':
      case 'datetime':
        return 'date';
      case 'int':
        return 'integer';
      case 'bigint':
      case 'number':
        return 'long';
      case 'double':
        return 'double';
      case 'float':
        return 'double';
    }

    // pass type if not found ...
    return jsType as ELASTIC_TYPES;
  }


  static flattenProperties(
    sourceRef: IEntityRef | IClassRef,
    prefix: string = '',
    done: any[] = []): IElasticFieldDef[] {
    const fields: IElasticFieldDef[] = [];
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
          type = isString(type) ? type.toLowerCase() : type.name.toLowerCase();
          fields.push({
            type: type,
            esType: this.mapType(type),
            name: _prefix,
            className: sourceRef.name
          });
        }
      }
    }
    return fields;
  }


  static buildMappingPropertiesTree(
    sourceRef: IEntityRef | IClassRef,
    prefix: string = '',
    done: any[] = []): any {
    const properties: any = {};
    for (const prop of sourceRef.getPropertyRefs()) {
      const _prefix = [prefix, prop.name].filter(x => !!x).join('.');
      if (prop.isReference()) {
        const ref = prop.getTargetRef();
        if (done.includes(ref)) {
          continue;
        }
        done.push(ref);
        const refProperties = this.buildMappingPropertiesTree(ref, _prefix, done);
        if (refProperties && keys(refProperties).length > 0) {
          properties[prop.name] = {
            properties: refProperties
          };

        }
      } else {
        let type = prop.getType();
        if (type) {
          type = isString(type) ? type.toLowerCase() : type.name.toLowerCase();

          let initial: any = { type: this.mapType(type) };
          if (initial.type === 'text') {
            initial = DEFAULT_TEXT_MAPPING;
          }
          // TODO type mapping mapping ...
          properties[prop.name] = initial;
        }
      }
    }

    return properties;
  }


  static resolveNameByIndex(instance: any): string {
    const xsdef: IndexEntityRef = IndexEntityRegistry.$().getEntityRefFor(instance);
    if (xsdef) {
      return xsdef.getAliasName();
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


  static buildIdQuery(entityRef: IndexEntityRef, id: any) {
    return [entityRef.getTypeName(), id].join('--');
  }
}

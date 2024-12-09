import { IndexEntityRegistry } from '../registry/IndexEntityRegistry';
import { IndexEntityRef } from '../registry/IndexEntityRef';
import { ClassRef, IClassRef, IEntityRef } from '@allgemein/schema-api';
import { IElasticFieldDef } from './IElasticFieldDef';
import { ClassUtils } from '@allgemein/base';
import { clone, get, isArray, isNull, isNumber, isObjectLike, isString, isUndefined, keys, set } from 'lodash';
import { DEFAULT_TEXT_MAPPING, ELASTIC_TYPES } from './Constants';
import { TreeUtils, WalkValues } from '@allgemein/base/utils/TreeUtils';

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
      case 'long':
      case 'number':
        return 'long';
      case 'double':
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
        if (refProperties &&  Object.keys(refProperties).length > 0) {
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


  static merge(source: any, dest: any) {
    const changes: any[] = [];
    TreeUtils.walk(dest, (x: WalkValues) => {
      // new sub-property
      const location = x.location.join('.');

      if (x.isLeaf) {
        // is leaf - check content
        if (isNull(x.index) && x.key) {
          // object path
          const value = get(source, location, undefined);
          if (isUndefined(value)) {
            // not exists, append to source
            set(source, location, x.value);
            changes.push({ type: 'missing', key: location });
          }
        } else if (isNull(x.key) && isNumber(x.index)) {
          // array element
          // check if array exists
          const parent = clone(x.location);
          parent.pop();
          const parentLocation = parent.join('.');
          const sourceArray = get(source, parentLocation, undefined);
          if (isArray(sourceArray)) {
            // source array exists check if value present
            const exists = sourceArray.find((y: any) => x === x.value);
            if (!exists) {
              // add missing value
              const position = sourceArray.length;
              sourceArray.push(x.value);
              changes.push({ type: 'push', key: parentLocation, position: position, value: x.value });
            }
          } else if (isUndefined(sourceArray)) {
            // source parent for appending structure is not the same
            set(source, parentLocation, [x.value]);
            changes.push({ type: 'create-push', key: parentLocation, position: 0, value: x.value });
          } else if (isObjectLike(sourceArray)) {
            // source parent is an object like entry
            // todo replace this with the array
            throw new Error('structural inconsistencies: needed array to add value found object-like entry [' + parentLocation + ']');
          } else {
            throw new Error('structural inconsistencies: needed array to add value found unknown [' + parentLocation + ']');
          }
        } else {
          throw new Error('no object or array node on leaf');
        }

        // in array
        const value = get(source, location, undefined);
        if (!isUndefined(value)) {
          let change = value !== x.value;
          if (change) {
            set(source, location, x.value);
            changes.push({ type: 'value', key: location, src: value, dst: x.value });
          }
        }
      } else {
        // is branch - check structure
        if (isNull(x.index) && x.key) {
          // object path
          const value = get(source, location, undefined);
          if (isUndefined(value)) {
            // not exists, append to source
            set(source, location, x.value);
            changes.push({ type: 'missing', key: location });
          }
        } else if (isNull(x.key) && isNumber(x.index)) {
          // array element
          const value = get(source, location, undefined);
          if (isUndefined(value)) {
            // not exists, append to source
            set(source, location, value);
          }


        } else {
          throw new Error('no object or array node on branch');
        }
      }
      // const _get = get(source, location, undefined);
      // if (x.key) {
      //
      // } else if (x.isLeaf) {
      //   const path = x.location.join('.');
      //   const _get = get(source, path, undefined);
      //   if (!isUndefined(_get)) {
      //     let _change = _get !== x.value;
      //     // changes = changes || _change;
      //     //
      //     // if (/type|copy/.test(path) && _change) {
      //     //   reindex = reindex || _change;
      //     // }
      //   }
      // }
    });
    return changes;
  }
}
